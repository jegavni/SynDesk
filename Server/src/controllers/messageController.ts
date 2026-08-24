import { Request, Response } from "express";
import { Types } from "mongoose";
import { User } from "../models/userModel.js";
import { Message } from "../models/messageModel.js";
import { Group } from "../models/groupModel.js";
import { getReceiverSocketId, io } from "../config/socket.js";
import cloudinary from "../config/cloudinary.js";

/**
 * Get all users and groups for the sidebar
 */
export const getUsersForSidebar = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user?._id) {
      res.status(401).json({
        message: "Unauthorized",
      });
      return;
    }

    const loggedInUserId = new Types.ObjectId(req.user._id.toString());

    // Get all users except logged-in user
    const filteredUsers = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password");

    // Get groups where logged-in user is a member
    const groups = await Group.find({
      members: { $in: [loggedInUserId] },
    });

    // Convert groups
    const groupList = groups.map((group) => ({
      ...group.toObject(),
      username: group.name,
      isGroup: true,
    }));

    // Convert users
    const userList = filteredUsers.map((user) => ({
      ...user.toObject(),
      isGroup: false,
    }));

    // Combine groups and users
    const combinedList = [...groupList, ...userList];

    res.status(200).json(combinedList);
  } catch (error) {
    console.error("Error in getUsersForSidebar:", error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

/**
 * Get messages between users or messages from a group
 */
export const getMessages = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user?._id) {
      res.status(401).json({
        message: "Unauthorized",
      });
      return;
    }

    const { id: chatIdStr } = req.params;

if (typeof chatIdStr !== "string") {
  res.status(400).json({
    message: "Invalid Chat ID",
  });
  return;
}
    const myId = new Types.ObjectId(req.user._id.toString());

    if (!chatIdStr) {
      res.status(400).json({
        message: "Chat ID is required",
      });
      return;
    }

    const chatId = new Types.ObjectId(chatIdStr);

    // Check whether chatId belongs to a group
    const isGroup = !!(await Group.exists({
      _id: chatId,
    }));

    let messages;

    if (isGroup) {
      // Get group messages
      messages = await Message.find({
        receiverId: chatId,
        isGroupMessage: true,
      }).sort({
        createdAt: 1,
      });
    } else {
      // Get one-to-one messages
      messages = await Message.find({
        $or: [
          {
            senderId: myId,
            receiverId: chatId,
            isGroupMessage: { $ne: true },
          },
          {
            senderId: chatId,
            receiverId: myId,
            isGroupMessage: { $ne: true },
          },
        ],
      }).sort({
        createdAt: 1,
      });
    }

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error in getMessages:", error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

/**
 * Send message
 */
export const sendMessage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user?._id) {
      res.status(401).json({
        message: "Unauthorized",
      });
      return;
    }

    const {
      text,
      image,
      file,
      fileType,
      isGroupMessage,
    } = req.body;

   const { id: receiverIdStr } = req.params;

if (typeof receiverIdStr !== "string") {
  res.status(400).json({
    message: "Invalid receiver ID",
  });
  return;
}

const senderId = new Types.ObjectId(
  req.user._id.toString()
);

const receiverId = new Types.ObjectId(
  receiverIdStr
);

    if (!text && !image && !file) {
      res.status(400).json({
        message: "Message cannot be empty",
      });
      return;
    }

    let imageUrl: string | undefined;
    let fileUrl: string | undefined;
    let finalFileType: string | undefined;

    /**
     * Upload image
     */
    if (
      typeof image === "string" &&
      image.startsWith("data:")
    ) {
      try {
        const uploadResponse =
          await cloudinary.uploader.upload(image, {
            folder: "syndesk_messages",
            resource_type: "auto",
          });

        imageUrl = uploadResponse.secure_url;
        fileUrl = uploadResponse.secure_url;
        finalFileType = "image";
      } catch (uploadError) {
        console.error(
          "Failed to upload image to Cloudinary:",
          uploadError
        );
        res.status(500).json({
          message: "Failed to upload image",
        });
        return;
      }
    }

    /**
     * Upload file
     */
    if (
      typeof file === "string" &&
      file.startsWith("data:")
    ) {
      try {
        const uploadResponse =
          await cloudinary.uploader.upload(file, {
            folder: "syndesk_messages",
            resource_type: "auto",
          });

        fileUrl = uploadResponse.secure_url;

        if (fileType) {
          finalFileType = fileType;
        } else if (file.startsWith("data:image/")) {
          finalFileType = "image";
        } else if (file.startsWith("data:video/")) {
          finalFileType = "video";
        } else if (file.startsWith("data:audio/")) {
          finalFileType = "audio";
        } else {
          finalFileType = "file";
        }
      } catch (uploadError) {
        console.error(
          "Failed to upload file to Cloudinary:",
          uploadError
        );
        res.status(500).json({
          message: "Failed to upload file",
        });
        return;
      }
    }

    /**
     * Create message
     */
    const newMessage = new Message({
      senderId,
      receiverId,
      text: text || "",
      image: imageUrl,
      fileUrl,
      fileType: finalFileType,
      isGroupMessage: Boolean(isGroupMessage),
    });

    await newMessage.save();

    /**
     * Send real-time notification
     */
    if (Boolean(isGroupMessage)) {
      const group = await Group.findById(receiverId);

      if (group) {
        for (const memberId of group.members) {
          const memberIdString = memberId.toString();
          const senderIdString = senderId.toString();

          // Don't send message back to sender
          if (memberIdString === senderIdString) {
            continue;
          }

          const memberSocketId =
            getReceiverSocketId(memberIdString);

          if (memberSocketId) {
            io.to(memberSocketId).emit(
              "newMessage",
              newMessage
            );
          }
        }
      }
    } else {
      const receiverSocketId =
        getReceiverSocketId(receiverIdStr);

      if (receiverSocketId) {
        io.to(receiverSocketId).emit(
          "newMessage",
          newMessage
        );
      }
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error in sendMessage:", error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

/**
 * Create group
 */
export const createGroup = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user?._id) {
      res.status(401).json({
        message: "Unauthorized",
      });
      return;
    }

    const { name, members } = req.body;
    const creatorId = req.user._id.toString();

    /**
     * Validate input
     */
    if (
      typeof name !== "string" ||
      !name.trim()
    ) {
      res.status(400).json({
        message: "Group name is required",
      });
      return;
    }

    if (
      !Array.isArray(members) ||
      members.length === 0
    ) {
      res.status(400).json({
        message: "Members list is required",
      });
      return;
    }

    /**
     * Convert all IDs to strings
     * and remove duplicates
     */
    const groupMembers = [
      ...new Set([
        ...members.map((member) => member.toString()),
        creatorId,
      ]),
    ];

    /**
     * Create group
     */
    const newGroup = new Group({
      name: name.trim(),
      creator: creatorId,
      members: groupMembers,
      isGroup: true,
    });

    await newGroup.save();

    /**
     * Response
     */
    const groupResponse = {
      ...newGroup.toObject(),
      username: newGroup.name,
      isGroup: true,
    };

    res.status(201).json(groupResponse);
  } catch (error) {
    console.error("Error in createGroup:", error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

/**
 * Delete a message
 */
export const deleteMessage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user?._id) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { id } = req.params;
    const userId = req.user._id.toString();

    const message = await Message.findById(id);

    if (!message) {
      res.status(404).json({ message: "Message not found" });
      return;
    }

    if (message.senderId.toString() !== userId) {
      res.status(403).json({ message: "You can only delete your own messages" });
      return;
    }

    // Delete media from Cloudinary if exists
    const mediaUrl = message.image || message.fileUrl;
    if (mediaUrl) {
      try {
        const parts = mediaUrl.split('/');
        const filename = parts[parts.length - 1]; // e.g. abc123def.jpg
        const publicIdWithExt = `syndesk_messages/${filename}`;
        const publicId = publicIdWithExt.split('.')[0]; // remove extension

        let resourceType = 'image';
        if (message.fileType === 'video' || message.fileType === 'audio') {
          resourceType = 'video';
        } else if (message.fileType === 'file') {
          resourceType = 'raw';
        }

        await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      } catch (err) {
        console.error("Error deleting media from Cloudinary:", err);
      }
    }

    await Message.findByIdAndDelete(id);

    // Broadcast deletion
    if (message.isGroupMessage) {
      const group = await Group.findById(message.receiverId);
      if (group) {
        for (const memberId of group.members) {
          const memberSocketId = getReceiverSocketId(memberId.toString());
          if (memberSocketId) {
            io.to(memberSocketId).emit("messageDeleted", { messageId: id });
          }
        }
      }
    } else {
      const receiverSocketId = getReceiverSocketId(message.receiverId.toString());
      const senderSocketId = getReceiverSocketId(message.senderId.toString());
      if (receiverSocketId) io.to(receiverSocketId).emit("messageDeleted", { messageId: id });
      if (senderSocketId) io.to(senderSocketId).emit("messageDeleted", { messageId: id });
    }

    res.status(200).json({ message: "Message deleted successfully", messageId: id });
  } catch (error) {
    console.error("Error in deleteMessage:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};