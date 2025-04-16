const { Server } = require("socket.io")

const chatSocketServer = (httpServer) => {
    const io = new Server(httpServer)
    // WebSocket connection
    io.on('connection', (socket) => {
        console.log("A new user connected: ", socket.id)

        socket.on('joinConversation', (conversationId) => {
            socket.join(conversationId);
            console.log("User joined conversation: ", conversationId)
        })

        socket.on("sendMessage", async (message) => {
            const {conversationId, senderid, content} = message
            try {
                
            } catch (error) {
                console.error("Failed to save message: ", error)
            }
        })
    })
}