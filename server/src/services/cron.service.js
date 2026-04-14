import cron from "node-cron";
import { User } from "../models/auth/user.model.js";
import Task from "../models/task/task.model.js";
import Todo from "../models/todo/todo.model.js";
import Notification from "../models/notification/notification.model.js";
import { LaunchSubscriber } from "../models/launch/LaunchSubscriber.model.js";
import * as LaunchService from "./launch.service.js";
import logger from "../utils/logger.js";
import sendEmail from "../utils/sendEmail.js";

/**
 * 6:00 PM Daily Summary

 * Aggregates work done today and sends a notification to each user.
 */
const dailyWorkSummary = async () => {
    try {
        logger.info("Running Daily Work Summary cron job...");

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const users = await User.find({ status: "active" });

        for (const user of users) {
            // 1. Get timelogs for today
            const tasksWithTimelogs = await Task.find({
                tenant_id: user.tenant_id,
                "timelogs.user": user._id,
                "timelogs.end_time": { $gte: startOfDay, $lte: endOfDay }
            });

            let totalMinutes = 0;
            tasksWithTimelogs.forEach(task => {
                task.timelogs.forEach(log => {
                    if (log.user.toString() === user._id.toString() &&
                        log.end_time >= startOfDay && log.end_time <= endOfDay) {
                        totalMinutes += log.duration_minutes || 0;
                    }
                });
            });

            // 2. Get completed tasks today
            const completedTasks = await Task.countDocuments({
                tenant_id: user.tenant_id,
                users: user._id,
                status: "completed",
                completed_at: { $gte: startOfDay, $lte: endOfDay }
            });

            // 3. Get completed todos today
            const completedTodos = await Todo.countDocuments({
                tenant_id: user.tenant_id,
                user: user._id,
                status: "completed",
                completed_at: { $gte: startOfDay, $lte: endOfDay }
            });

            if (totalMinutes > 0 || completedTasks > 0 || completedTodos > 0) {
                const hours = Math.floor(totalMinutes / 60);
                const mins = totalMinutes % 60;
                const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

                const message = `Today you logged ${timeStr} of work, completed ${completedTasks} tasks and ${completedTodos} todos. Keep it up!`;

                // Create In-App Notification
                await Notification.create({
                    tenant_id: user.tenant_id,
                    recipient: user._id,
                    type: "daily_summary",
                    title: "Daily Work Summary",
                    message,
                    link: "/dashboard" // Or a specific report link
                });

                // Optionally send email
                try {
                    await sendEmail({
                        to: user.email,
                        subject: "Your Daily Work Summary - FGROW",
                        text: message,
                        html: `<p>${message}</p>`
                    });
                } catch (emailErr) {
                    logger.error(`Failed to send summary email to ${user.email}:`, emailErr);
                }
            }
        }

        logger.info("Daily Work Summary cron job completed.");
    } catch (err) {
        logger.error("Error in dailyWorkSummary cron:", err);
    }
};

/**
 * Task Reminders
 * Checks for tasks/todos due in the next 24 hours.
 */
const taskReminders = async () => {
    try {
        logger.info("Running Task Reminders cron job...");

        const now = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Find tasks due within 24 hours that are not completed/cancelled
        const upcomingTasks = await Task.find({
            due_date: { $gt: now, $lte: tomorrow },
            status: { $nin: ["completed", "cancelled"] },
            archived: false
        });

        for (const task of upcomingTasks) {
            for (const userId of task.users) {
                const existingRemind = await Notification.findOne({
                    recipient: userId,
                    type: "task_reminder",
                    "metadata.taskId": task._id,
                    createdAt: { $gt: new Date(Date.now() - 12 * 60 * 60 * 1000) } // Don't spam, once every 12h
                });

                if (!existingRemind) {
                    await Notification.create({
                        tenant_id: task.tenant_id,
                        recipient: userId,
                        type: "task_reminder",
                        title: "Task Reminder",
                        message: `Task "${task.title}" is due by ${task.due_date.toLocaleString()}`,
                        link: `/tasks/${task._id}`,
                        metadata: { taskId: task._id }
                    });
                }
            }
        }

        // Similar for Todos
        const upcomingTodos = await Todo.find({
            due_date: { $gt: now, $lte: tomorrow },
            status: { $nin: ["completed", "cancelled"] },
            archived: false
        });

        for (const todo of upcomingTodos) {
            if (todo.user) {
                const existingRemind = await Notification.findOne({
                    recipient: todo.user,
                    type: "task_reminder",
                    "metadata.todoId": todo._id,
                    createdAt: { $gt: new Date(Date.now() - 12 * 60 * 60 * 1000) }
                });

                if (!existingRemind) {
                    await Notification.create({
                        tenant_id: todo.tenant_id,
                        recipient: todo.user,
                        type: "task_reminder",
                        title: "Todo Reminder",
                        message: `Todo "${todo.title}" is due by ${todo.due_date.toLocaleString()}`,
                        link: "/todos",
                        metadata: { todoId: todo._id }
                    });
                }
            }
        }

        logger.info("Task Reminders cron job completed.");
    } catch (err) {
        logger.error("Error in taskReminders cron:", err);
    }
};

/**
 * Launch Day Announcement
 * Fires at 18:00 IST on April 20.
 */
const launchAnnouncement = async () => {
    try {
        await LaunchService.runLaunchAnnouncement();
    } catch (err) {
        logger.error("Error in launchAnnouncement cron:", err);
    }
};


export const initCron = () => {
    // Daily Summary at 6:00 PM (18:00)
    cron.schedule("0 18 * * *", dailyWorkSummary);

    // Task Reminders every hour
    cron.schedule("0 * * * *", taskReminders);

    // Launch Announcement: April 20 at 18:00 IST
    // (IST is UTC+5:30. 18:00 IST = 12:30 UTC)
    // Format: 'minute hour day month dayOfWeek'
    cron.schedule("00 18 20 4 *", launchAnnouncement, {
        timezone: "Asia/Kolkata"
    });

    logger.info("Cron services initialized.");
};

