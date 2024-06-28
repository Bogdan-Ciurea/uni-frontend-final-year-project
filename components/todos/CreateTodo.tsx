import {
  Button,
  Text,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  useDisclosure,
  ModalFooter,
  Input,
} from "@chakra-ui/react";
import { Dispatch, SetStateAction, useState } from "react";
import { ActionType, Todo } from "../../pages/todo";

type Props = {
  todos: Todo[];
  setTodos: Dispatch<SetStateAction<Todo[]>>;
  setIndex: Dispatch<SetStateAction<number>>;
  setActionType: Dispatch<SetStateAction<ActionType>>;
};

function DrawCreateTodo({ todos, setTodos, setIndex, setActionType }: Props) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [todoText, setTodoText] = useState<string>("");

  const handleCreateTodo = () => {
    onClose();
    setIndex(todos ? todos.length : 0);
    setActionType(ActionType.CREATE);
    if (!todos) {
      setTodos([
        {
          todo_id: "something_temporary",
          text: todoText,
          type: 0,
        },
      ]);
      return;
    }

    setTodos((todos) => {
      const newTodos = [...todos];
      newTodos.push({
        todo_id: "something_temporary",
        text: todoText,
        type: 0,
      });
      return newTodos;
    });
  };

  return (
    <>
      <Button
        w="50%"
        ml="25%"
        colorScheme="teal"
        variant="outline"
        onClick={onOpen}
      >
        Add Todo
      </Button>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add Todo</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Input
              variant="filled"
              placeholder="Todo text"
              value={todoText}
              onChange={(e) => setTodoText(e.target.value)}
            />
          </ModalBody>

          <ModalFooter>
            <Button variant="green" mr={3} onClick={onClose}>
              Close
            </Button>
            <Button colorScheme="green" onClick={handleCreateTodo}>
              Create Todo
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

export default DrawCreateTodo;
