const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const app = express()
app.use(express.json())
const dbPath = path.join(__dirname, 'todoApplication.db')
let db = null

const initiallizeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log(
        'Server Running at https://yogichaitanyapncjfnjscprhnky.drops.nxtwave.tech:3000/',
      )
    })
  } catch (e) {
    console.log(`DB ERROR: ${e.message}`)
    process.exit(1)
  }
}

initiallizeDBAndServer()

// API 1
const hasPriorityAndStatusProperties = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}
const hasPriorityProperty = requestQuery => {
  return requestQuery.priority !== undefined
}
const hasStatusProperty = requestQuery => {
  return requestQuery.status !== undefined
}

app.get('/todos/', async (request, response) => {
  let data = null
  let getTodoQuery = ''
  const {search_q = '', status, priority} = request.query

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodoQuery = `
        SELECT
          * 
        FROM 
          todo 
        WHERE 
          todo LIKE '%${search_q}%'
          AND priority='${priority}'
          AND status='${status}';`
      break
    case hasPriorityProperty(request.query):
      getTodoQuery = `
        SELECT 
          * 
        FROM 
          todo
        WHERE 
          todo LIKE '%${search_q}%'
          AND priority='${priority}';`
      break
    case hasStatusProperty(request.query):
      getTodoQuery = `
        SELECT 
          * 
        FROM 
          todo
        WHERE 
          todo LIKE '%${search_q}%'
          AND status='${status}';`
      break
    default:
      getTodoQuery = `
        SELECT 
          *
        FROM
          todo
        WHERE 
          todo LIKE '%${search_q}%';`
  }
  data = await db.all(getTodoQuery)
  response.send(data)
})

//API 2
app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getSpecificTodoDetails = `SELECT * FROM todo WHERE id=${todoId};`
  const specificTodo = await db.get(getSpecificTodoDetails)
  response.send(specificTodo)
})

// API 3
app.post('/todos/', async (request, response) => {
  const todoDetails = request.body
  const {id, todo, priority, status} = todoDetails
  const addTodoQuery = `INSERT INTO todo(id,todo,priority,status) VALUES(${id},'${todo}','${priority}','${status}');`
  await db.run(addTodoQuery)
  response.send('Todo Successfully Added')
})

// API 4
app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const requestBody = request.body
  let updateColumn = ''

  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = 'Status'
      break
    case requestBody.priority !== undefined:
      updateColumn = 'Priority'
      break
    case requestBody.todo !== undefined:
      updateColumn = 'Todo'
      break
  }

  const previousTodoQuery = `
  SELECT 
    * 
  FROM 
    todo 
  WHERE 
    id=${todoId};`

  const previousTodo = await db.get(previousTodoQuery)

  const {
    todo = previousTodo.todo,
    status = previousTodo.status,
    priority = previousTodo.priority,
  } = request.body

  const updateTodoQuery = `
  UPDATE
    todo 
  SET 
    todo='${todo}',
    priority='${priority}',
    status='${status}'
  WHERE
    id=${todoId};`

  await db.run(updateTodoQuery)
  response.send(`${updateColumn} Updated`)
})

// API 5
app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteTodo = `DELETE FROM todo WHERE id=${todoId};`
  await db.run(deleteTodo)
  response.send('Todo Deleted')
})

module.exports = app
