import { Text, Center, VStack, SimpleGrid, Box } from "@chakra-ui/react";
import { Dispatch, SetStateAction } from "react";
import { useDrop } from "react-dnd";
import { ActionType, Todo, TodoType } from "../../pages/todo";
import DrawTodoCard from "./TodoCard";
import todoTheme from "./todoTheme";

type Props = {
  todos: Todo[];
  setTodos: Dispatch<SetStateAction<Todo[]>>;
  setIndex: Dispatch<SetStateAction<number>>;
  setActionType: Dispatch<SetStateAction<ActionType>>;
};

function DrawColumns({ todos, setTodos, setIndex, setActionType }: Props) {
  const not_started = todos.filter(
    (todo) => todo.type === TodoType.NOT_STARTED
  );
  const in_progress = todos.filter(
    (todo) => todo.type === TodoType.IN_PROGRESS
  );
  const done = todos.filter((todo) => todo.type === TodoType.DONE);

  const [{ isOver_not_started }, drop1] = useDrop({
    accept: "card",
    drop: (item: Todo) => {
      // find the index of the todo that was dragged
      const index = todos.findIndex((todo) => todo.todo_id === item.todo_id);
      if (todos[index].type === TodoType.NOT_STARTED) return;
      setIndex(index);
      setActionType(ActionType.UPDATE);

      setTodos((todos) => {
        const newTodos = [...todos];
        newTodos[index].type = TodoType.NOT_STARTED;
        return newTodos;
      });
    },
    collect: (monitor) => ({
      isOver_not_started: !!monitor.isOver(),
    }),
  });

  const [{ isOver_in_progress }, drop2] = useDrop({
    accept: "card",
    drop: (item: Todo) => {
      // find the index of the todo that was dragged
      const index = todos.findIndex((todo) => todo.todo_id === item.todo_id);
      if (todos[index].type === TodoType.IN_PROGRESS) return;
      setIndex(index);
      setActionType(ActionType.UPDATE);

      setTodos((todos) => {
        const newTodos = [...todos];
        newTodos[index].type = TodoType.IN_PROGRESS;
        return newTodos;
      });
    },
    collect: (monitor) => ({
      isOver_in_progress: !!monitor.isOver(),
    }),
  });

  const [{ isOver_done }, drop3] = useDrop({
    accept: "card",
    drop: (item: Todo) => {
      // find the index of the todo that was dragged
      const index = todos.findIndex((todo) => todo.todo_id === item.todo_id);
      if (todos[index].type === TodoType.DONE) return;
      setIndex(index);
      setActionType(ActionType.UPDATE);

      setTodos((todos) => {
        const newTodos = [...todos];
        newTodos[index].type = TodoType.DONE;
        return newTodos;
      });
    },
    collect: (monitor) => ({
      isOver_done: !!monitor.isOver(),
    }),
  });

  return (
    <SimpleGrid w="90vw" mt="40px" spacing="50px" columns={3} ml="5vw">
      <Box
        rounded="md"
        ref={drop1}
        bg={
          isOver_not_started
            ? todoTheme.semanticTokens.colors.todoColumnHover
            : todoTheme.semanticTokens.colors.todoColumn
        }
      >
        <Center mb="30px">
          <Text fontSize="3xl">Not Started</Text>
        </Center>
        <VStack>
          {not_started.map((todo) => (
            <DrawTodoCard
              todos={todos}
              index={todos.findIndex((t: Todo) => t.todo_id === todo.todo_id)}
              setTodos={setTodos}
              setIndex={setIndex}
              setActionType={setActionType}
            />
          ))}
        </VStack>
      </Box>
      <Box
        w="100%"
        rounded="md"
        ref={drop2}
        bg={
          isOver_in_progress
            ? todoTheme.semanticTokens.colors.todoColumnHover
            : todoTheme.semanticTokens.colors.todoColumn
        }
      >
        <Center mb="30px">
          <Text fontSize="3xl">In Progress</Text>
        </Center>
        <VStack>
          {in_progress.map((todo) => (
            <DrawTodoCard
              todos={todos}
              index={todos.findIndex((t: Todo) => t.todo_id === todo.todo_id)}
              setTodos={setTodos}
              setIndex={setIndex}
              setActionType={setActionType}
            />
          ))}
        </VStack>
      </Box>
      <Box
        w="100%"
        rounded="md"
        ref={drop3}
        bg={
          isOver_done
            ? todoTheme.semanticTokens.colors.todoColumnHover
            : todoTheme.semanticTokens.colors.todoColumn
        }
      >
        <Center mb="30px">
          <Text fontSize="3xl">Done</Text>
        </Center>
        <VStack>
          {done.map((todo) => (
            <DrawTodoCard
              todos={todos}
              index={todos.findIndex((t: Todo) => t.todo_id === todo.todo_id)}
              setTodos={setTodos}
              setIndex={setIndex}
              setActionType={setActionType}
            />
          ))}
        </VStack>
      </Box>
    </SimpleGrid>
  );
}

export default DrawColumns;
