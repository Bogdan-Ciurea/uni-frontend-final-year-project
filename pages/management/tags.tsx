import {
  Box,
  Center,
  HStack,
  Heading,
  useToast,
  Text,
  Link,
  TableContainer,
  Table,
  Thead,
  Tr,
  Tbody,
  Th,
  Td,
  Input,
  InputGroup,
  InputLeftAddon,
  Select,
  Button,
  Tag,
  useDisclosure,
  VStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  UseToastOptions,
  Flex,
} from "@chakra-ui/react";
import Layout from "../../components/Layout";
import { GetServerSideProps } from "next";
import { withIronSessionSsr } from "iron-session/next";
import { UserType, iron_api_options } from "../../lib/session";
import { Dispatch, SetStateAction, useReducer, useState } from "react";

type Tag = {
  id: string;
  name: string;
  colour: string;
};

type Props = {
  tags: Tag[];
  error: string;
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

  if (req.session.user.user_type === UserType.Student) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  const response = await fetch(process.env.BACKEND_URL + "/api/tags", {
    method: "GET",
    headers: {
      Authorization: "Bearer " + req.session.user.token,
    },
  });

  if (response.status !== 200) {
    return {
      props: {
        tags: [] as Tag[],
        error: (await response.json()).error,
      },
    };
  }

  const tags = (await response.json()) as Tag[];

  return {
    props: {
      error: null,
      tags,
    },
  };
};

export const getServerSideProps = withIronSessionSsr(ssp, iron_api_options);

function ManagementLayout({ children }: { children: React.ReactNode }) {
  return (
    <Layout>
      <Center mt="20px">
        <Heading>Management</Heading>
      </Center>
      <HStack w="100%">
        <Box w="20%" mb="auto">
          <Center mt="20px">
            <Heading>Menu</Heading>
          </Center>

          <Box mt="20px">
            <Center>
              <Link href="/management/users">
                <Text fontSize="2xl">Users</Text>
              </Link>
            </Center>
            <Center>
              <Link href="/management/tags">
                <Text fontSize="2xl">Tags</Text>
              </Link>
            </Center>
          </Box>
        </Box>
        <Box w="80%">{children}</Box>
      </HStack>
    </Layout>
  );
}

type FormState = {
  name: string;
  colour: string;
  error: string;
  reset: string;
};

type FormAction =
  | { type: "name"; payload: string }
  | { type: "colour"; payload: string }
  | { type: "error"; payload: string }
  | { type: "reset"; payload: string };

const initialFormState: FormState = {
  name: "",
  colour: "",
  error: "",
  reset: "",
};

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "reset":
      return initialFormState;
    case "name":
      return {
        ...state,
        name: action.payload,
      };
    case "colour":
      return {
        ...state,
        colour: action.payload,
      };
    case "error":
      return {
        ...state,
        error: action.payload,
      };
    default:
      return state;
  }
}

function DisplayTagTable({
  tags,
  setSelectedTag,
  toast,
  setTagList,
}: {
  tags: Tag[];
  setSelectedTag: Dispatch<SetStateAction<Tag | null>>;
  toast: (options: UseToastOptions) => void;
  setTagList: Dispatch<SetStateAction<Tag[]>>;
}) {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Box w="55%" mb="auto">
      <Center mt="20px">
        <Heading>Tags</Heading>
      </Center>

      <Flex>
        <Button onClick={onOpen}>Create Tag</Button>
      </Flex>

      <TableContainer>
        <Table variant="striped" colorScheme="gray">
          <Thead>
            <Tr>
              <Th>Tag Name</Th>
              <Th>Colour</Th>
            </Tr>
          </Thead>
          <Tbody>
            {tags.map((tag) => (
              <Tr
                key={tag.id}
                onClick={() => {
                  setSelectedTag(tag);
                }}
              >
                <Td>{tag.name}</Td>
                <Td>
                  <Tag colorScheme={tag.colour} variant="solid">
                    {tag.colour}
                  </Tag>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>

      <DisplayCreateTag
        isOpen={isOpen}
        onClose={onClose}
        setTagList={setTagList}
        toast={toast}
      />
    </Box>
  );
}

function DisplayTagDetails({
  tag,
  setTagList,
  toast,
}: {
  tag: Tag;
  setTagList: Dispatch<SetStateAction<Tag[]>>;
  toast: (options: UseToastOptions) => void;
}) {
  const [formState, dispatch] = useReducer(formReducer, initialFormState);

  const updateTag = async () => {
    const response = await fetch("http://localhost:3000/api/management/tags", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: tag.id,
        name: formState.name ? formState.name : null,
        colour: formState.colour ? formState.colour : null,
      }),
    });

    if (response.status !== 200) {
      const error = (await response.json()).error;

      toast({
        title: "Error",
        description: error,
        status: "error",
        duration: 5000,
        isClosable: true,
      });

      return;
    }

    toast({
      title: "Success",
      description: "Tag updated successfully",
      status: "success",
      duration: 5000,
      isClosable: true,
    });

    setTagList((tags) => {
      const newTags = [...tags];
      const index = newTags.findIndex((t) => t.id === tag.id);
      newTags[index] = {
        ...newTags[index],
        name: formState.name !== "" ? formState.name : tag.name,
        colour: formState.colour !== "" ? formState.colour : tag.colour,
      };
      return newTags;
    });

    dispatch({ type: "reset", payload: "" });
  };

  const deleteTag = async () => {
    const response = await fetch("http://localhost:3000/api/management/tags", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: tag.id,
      }),
    });

    if (response.status !== 200) {
      const error = (await response.json()).error;
      toast({
        title: "Error",
        description: error,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setTagList((tags) => {
      return tags.filter((t) => t.id !== tag.id);
    });
  };

  return (
    <Box ml="10%" w="40%" mb="auto">
      <Center>
        <Heading>Tag Details</Heading>
      </Center>

      {tag ? (
        <VStack spacing="24px" mt="20px">
          <InputGroup>
            <InputLeftAddon w="100px" children="Tag Name" />
            <Input
              type="text"
              placeholder={tag.name}
              onChange={(e) => {
                dispatch({ type: "name", payload: e.target.value });
              }}
            />
          </InputGroup>

          <InputGroup>
            <InputLeftAddon w="100px" children="Colour" />
            <Select
              value={formState.colour ? formState.colour : tag.colour}
              onChange={(e) => {
                dispatch({ type: "colour", payload: e.target.value });
              }}
            >
              <option value="red">Red</option>
              <option value="orange">Orange</option>
              <option value="yellow">Yellow</option>
              <option value="green">Green</option>
              <option value="teal">Teal</option>
              <option value="blue">Blue</option>
              <option value="cyan">Cyan</option>
              <option value="purple">Purple</option>
              <option value="pink">Pink</option>
              <option value="linkedin">LinkedIn</option>
              <option value="facebook">Facebook</option>
              <option value="messenger">Messenger</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="twitter">Twitter</option>
              <option value="telegram">Telegram</option>
            </Select>
          </InputGroup>
          <HStack spacing="30px">
            <Button
              onClick={() => updateTag()}
              colorScheme={
                formState.colour !== "" || formState.name !== ""
                  ? "blue"
                  : "red"
              }
            >
              Update
            </Button>
            <Button
              onClick={() => deleteTag()}
              colorScheme="red"
              variant="solid"
            >
              Delete
            </Button>
          </HStack>
        </VStack>
      ) : (
        <Text ml="40px" fontSize="2xl">
          No Tag Selected
        </Text>
      )}
    </Box>
  );
}

function DisplayCreateTag({
  isOpen,
  onClose,
  setTagList,
  toast,
}: {
  isOpen: boolean;
  onClose: () => void;
  setTagList: Dispatch<SetStateAction<Tag[]>>;
  toast: (options: UseToastOptions) => void;
}) {
  const [formState, dispatch] = useReducer(formReducer, initialFormState);

  const createTag = async () => {
    if (formState.name === "" || formState.colour === "") {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        status: "error",
        duration: 5000,
        isClosable: true,
      });

      return;
    }

    const response = await fetch("http://localhost:3000/api/management/tags", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: formState.name,
        colour: formState.colour,
      }),
    });

    if (response.status !== 200) {
      const error = (await response.json()).error;

      toast({
        title: "Error",
        description: error,
        status: "error",
        duration: 5000,
        isClosable: true,
      });

      return;
    }

    toast({
      title: "Success",
      description: "Tag created successfully",
      status: "success",
      duration: 5000,
      isClosable: true,
    });

    const new_tag = (await response.json()) as Tag;

    setTagList((tags) => {
      return [...tags, new_tag];
    });

    dispatch({ type: "reset", payload: "" });
    onClose();
  };

  return (
    <Box>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create Tag</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <InputGroup>
              <InputLeftAddon w="100px" children="Tag Name" />
              <Input
                type="text"
                placeholder="Tag Name"
                onChange={(e) => {
                  dispatch({ type: "name", payload: e.target.value });
                }}
              />
            </InputGroup>

            <InputGroup mt="10px">
              <InputLeftAddon w="100px" children="Colour" />
              <Select
                value={formState.colour}
                onChange={(e) => {
                  dispatch({ type: "colour", payload: e.target.value });
                }}
              >
                <option value="red">Red</option>
                <option value="orange">Orange</option>
                <option value="yellow">Yellow</option>
                <option value="green">Green</option>
                <option value="blue">Blue</option>
                <option value="cyan">Cyan</option>
                <option value="purple">Purple</option>
                <option value="pink">Pink</option>
                <option value="linkedin">LinkedIn</option>
                <option value="facebook">Facebook</option>
                <option value="messenger">Messenger</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="twitter">Twitter</option>
                <option value="telegram">Telegram</option>
              </Select>
            </InputGroup>

            {formState.name !== "" && formState.colour !== "" ? (
              <Center>
                <Tag mt="10px" colorScheme={formState.colour} variant="solid">
                  {formState.name}
                </Tag>
              </Center>
            ) : null}
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme={
                formState.colour !== "" || formState.name !== ""
                  ? "blue"
                  : "red"
              }
              mr={3}
              onClick={() => createTag()}
            >
              Create
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

function TagManagementPage({ tags, error }: Props) {
  const toast = useToast();
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [tagList, setTagList] = useState<Tag[]>(tags);

  if (error) {
    toast({
      title: "Error",
      description: error,
      status: "error",
      duration: 5000,
      isClosable: true,
    });

    return (
      <ManagementLayout>
        <></>
      </ManagementLayout>
    );
  }

  return (
    <ManagementLayout>
      <HStack w="100%">
        <DisplayTagTable
          toast={toast}
          tags={tagList}
          setSelectedTag={setSelectedTag}
          setTagList={setTagList}
        />
        <DisplayTagDetails
          tag={selectedTag}
          setTagList={setTagList}
          toast={toast}
        />
      </HStack>
    </ManagementLayout>
  );
}

export default TagManagementPage;
