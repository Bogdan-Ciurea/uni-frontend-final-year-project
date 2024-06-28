import {
  Alert,
  AlertIcon,
  AlertTitle,
  Button,
  Center,
  Heading,
  SimpleGrid,
  useDisclosure,
} from "@chakra-ui/react";
import { withIronSessionSsr } from "iron-session/next";
import { GetServerSideProps } from "next";
import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { iron_api_options } from "../lib/session";

import DrawColumns from "../components/todos/Column";
import DrawCreateTodo from "../components/todos/CreateTodo";

export enum TodoType {
  NOT_STARTED = 0,
  IN_PROGRESS = 1,
  DONE = 2,
}

export enum ActionType {
  CREATE = 0,
  UPDATE = 1,
  DELETE = 2,
}

export type Todo = {
  todo_id: string;
  text: string;
  type: TodoType;
};

type Props = {
  todo_list: Todo[];
  error: string;
  user_token: string;
};

const ssp: GetServerSideProps<Props> = async ({ req }) => {
  if (!req.session || !req.session.user || !req.session.user.token) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  const response = await fetch(process.env.BACKEND_URL + "/api/todos", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + req.session.user.token,
    },
  });

  if (response.status !== 200) {
    return {
      props: {
        todo_list: null,
        error: (
          (await response.json()) as {
            error: string;
          }
        ).error,
        user_token: req.session.user.token,
      },
    };
  }

  const todos = (await response.json()) as Todo[];

  return {
    props: {
      todo_list: todos,
      error: null,
      user_token: req.session.user.token,
    },
  };
};

export const getServerSideProps = withIronSessionSsr(ssp, iron_api_options);

function TodoPage({ todo_list, error, user_token }: Props) {
  const [todos, setTodos] = useState<Todo[]>(todo_list);

  const [changedIndex, setChangedIndex] = useState<number>(null);
  const [actionType, setActionType] = useState<ActionType>(null);

  useEffect(() => {
    if (changedIndex === null || actionType === null) {
      return;
    }

    async function create(todo: Todo): Promise<string | void> {
      const response = await fetch("http://localhost:3000/api/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: todo.text,
          // Based on the type, we need to send a string
          type:
            todo.type === TodoType.NOT_STARTED
              ? "NOT_STARTED"
              : todo.type === TodoType.IN_PROGRESS
              ? "IN_PROGRESS"
              : "DONE",
        }),
      });

      const response_json = await response.json();

      if (response.status !== 201) {
        return null;
      }

      return response_json.id;
    }

    async function update(todo_id: string, type: TodoType) {
      let string_type: string;

      if (type === TodoType.NOT_STARTED) {
        string_type = "NOT_STARTED";
      } else if (type === TodoType.IN_PROGRESS) {
        string_type = "IN_PROGRESS";
      } else if (type === TodoType.DONE) {
        string_type = "DONE";
      }

      const response = await fetch("http://localhost:3000/api/todos", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          todo_id: todo_id,
          string_type: string_type,
        }),
      });
      const response_json = await response.json();

      if (response.status !== 200) {
        console.log(response_json.error);
      }

      return null;
    }

    async function delete_todo(todo_id: string): Promise<string> {
      const response = await fetch("http://localhost:3000/api/todos", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          todo_id: todo_id,
        }),
      });
      const response_json = await response.json();

      if (response.status !== 200) {
        console.log(response_json.error);
        return response_json.error;
      }

      return null;
    }

    if (actionType === ActionType.UPDATE) {
      update(todos[changedIndex].todo_id, todos[changedIndex].type);
    } else if (actionType === ActionType.DELETE) {
      const todo_delete_promise = delete_todo(todos[changedIndex].todo_id);
      // If the promise is not empty, then it is an error
      todo_delete_promise
        .then((error) => {
          if (error !== null) {
            console.log(error);
          } else {
            setChangedIndex(null);
            setActionType(null);
            setTodos((todos) => {
              const new_todos = [...todos];
              new_todos.splice(changedIndex, 1);
              return new_todos;
            });
          }
        })
        .catch((error) => {
          console.log(error);
        });
    } else if (actionType === ActionType.CREATE) {
      const todo_id_promise = create(todos[changedIndex]);
      todo_id_promise
        .then((todo_id) => {
          setChangedIndex(null);
          setActionType(null);

          // Update the todo_id in the todos array. It is the last element of the array
          setTodos((todos) => {
            const new_todos = [...todos];
            new_todos[new_todos.length - 1].todo_id = todo_id as string;
            return new_todos;
          });
        })
        .catch((error) => {
          todos.splice(changedIndex, 1);
        });

      error = null;
    }

    setChangedIndex(null);
    setActionType(null);
  }, [todos]);

  return (
    <Layout>
      <>
        <Center mt="5vh">
          <Heading>Your todos</Heading>
        </Center>
        <SimpleGrid w="90vw" mt="40px" spacing="50px" columns={3} ml="5vw">
          <DrawCreateTodo
            todos={todos}
            setTodos={setTodos}
            setIndex={setChangedIndex}
            setActionType={setActionType}
          />
        </SimpleGrid>
        {error ? (
          <Alert status="error">
            <AlertIcon />
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        ) : (
          <DrawColumns
            todos={todos}
            setTodos={setTodos}
            setIndex={setChangedIndex}
            setActionType={setActionType}
          />
        )}
      </>
    </Layout>
  );
}

export default TodoPage;
