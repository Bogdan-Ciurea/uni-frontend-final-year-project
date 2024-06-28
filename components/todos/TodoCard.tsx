import { DeleteIcon } from "@chakra-ui/icons";
import {
  Text,
  Box,
  Center,
  Stack,
  Button,
  HStack,
  Flex,
} from "@chakra-ui/react";
import { Dispatch, SetStateAction } from "react";
import { useDrag } from "react-dnd";
import { ActionType, Todo } from "../../pages/todo";
import todoTheme from "./todoTheme";

type Props = {
  todos: Todo[];
  index: number;
  setTodos: Dispatch<SetStateAction<Todo[]>>;
  setIndex: Dispatch<SetStateAction<number>>;
  setActionType: Dispatch<SetStateAction<ActionType>>;
};

function DrawTodoCard({
  todos,
  index,
  setTodos,
  setIndex,
  setActionType,
}: Props) {
  const [{ isDragging }, drag] = useDrag({
    type: "card",
    item: {
      todo_id: todos[index].todo_id,
      index: index,
      text: todos[index].text,
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  return (
    <Flex
      key={index}
      boxShadow="dark-lg"
      p="6"
      rounded="md"
      bg={todoTheme.semanticTokens.colors.todoCard}
      ref={drag}
      w="75%"
    >
      {/* bgColor={isDragging? "gray.200" : "yellow.000"}> */}
      <Center w="100%">
        <Text fontSize="xl">{todos[index].text}</Text>
      </Center>

      <Button
        onClick={() => {
          setIndex(todos.length - 1);
          setActionType(ActionType.DELETE);
          setTodos((todos) => {
            // Move the todo to the end of the array
            const newTodos = [...todos];
            newTodos.splice(index, 1);
            newTodos.push(todos[index]);
            return newTodos;
          });
        }}
      >
        <DeleteIcon />
      </Button>
    </Flex>
  );
}

export default DrawTodoCard;
