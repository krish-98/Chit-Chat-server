const express = require('express')
const socketio = require('socket.io')
const http = require('http')
const cors = require('cors')

const { addUser, removeUser, getUser, getUserInRoom } = require('./user.js')

const PORT = process.env.PORT || 5000

const router = require('./router')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

app.use(router)
app.use(cors())
  
// (socket) param specifically refers to client instance
io.on('connection', (socket) => {
  
  // Getting the user data from the front-end
  socket.on('join', ({ name:name, room:room }, callback) => {
    const { error, user } = addUser({ id: socket.id, name: name, room: room })

    if(error) return callback(error)

    socket.emit('message', { user: 'admin', text: `${user.name}, welcome to the room ${room}` })
    socket.broadcast.to(user.room).emit('message', { user: 'admin', text: `${user.name}, has joined!` })

    socket.join(user.room)

    io.to(user.room).emit('roomData', { room: user.room, users: getUserInRoom(user.room)})

    callback()
  })  

  socket.on('sendMessage', (message, callback) => {
    const user = getUser(socket.id)

    io.to(user.room).emit('message', { user: user.name, text: message })
    io.to(user.room).emit('roomData', { room: user.room, users: getUserInRoom(user.room)})

    callback()
  })

  socket.on('disconnect', () => {
    const user = removeUser(socket.id)

    if(user){
      io.to(user.room).emit('message', { user: 'admin', text: `${user.name} has left.` })
    }
  })
})


server.listen(PORT, () => console.log(`Server has started on port ${PORT}`))

