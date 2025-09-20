// A simple Node.js and Express.js serverless function for Vercel.
// We'll import Express to handle the routing and body parsing.
const express = require('express');

// This is the core function that Vercel will run.
module.exports = (req, res) => {
    // Vercel's serverless functions use a specific request/response pattern.
    // The incoming request body (from your front-end) will be available in req.body.
    
    // Check if the request method is POST. Our front-end will send a POST request.
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    // Get the data sent from the front-end
    const { subject, message, recipients } = req.body;

    // Basic validation to make sure we received the necessary data
    if (!subject || !message || !recipients || recipients.length === 0) {
        return res.status(400).json({ message: 'Missing required campaign data.' });
    }

    // --- Campaign Simulation Logic ---

    // Total number of emails to be "sent"
    const totalRecipients = recipients.length;
    
    // Simulate some failures (e.g., 5% of emails fail)
    const failedCount = Math.floor(totalRecipients * 0.05);
    const sentCount = totalRecipients - failedCount;
    
    // Simulate opens (e.g., 20% of sent emails are "opened")
    const opensCount = Math.floor(sentCount * 0.20);

    // Prepare the response data
    const campaignMetrics = {
        status: 'Completed',
        sent_count: sentCount,
        failed_count: failedCount,
        opens_count: opensCount,
    };

    // Send a success response back to the front-end with the simulated metrics
    res.status(200).json({
        message: 'Campaign sending simulated successfully!',
        metrics: campaignMetrics,
    });
};