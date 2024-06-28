import {
  Box,
  Center,
  HStack,
  Heading,
  useToast,
  Text,
  Link,
  useColorModeValue,
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
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerCloseButton,
  DrawerBody,
  DrawerFooter,
  VStack,
  SimpleGrid,
  Spacer,
  UseToastOptions,
  FormControl,
  FormLabel,
  ModalBody,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalFooter,
} from "@chakra-ui/react";
import Layout from "../../components/Layout";
import { GetServerSideProps } from "next";
import { withIronSessionSsr } from "iron-session/next";
import { UserType, iron_api_options } from "../../lib/session";
import {
  Dispatch,
  SetStateAction,
  useEffect,
  useReducer,
  useState,
} from "react";
import useUser from "../../hooks/useUser";

type Props = {
  users: SchoolUser[];
  tags: Tag[];
  error: string;
};

type Tag = {
  id: string;
  name: string;
  colour: string;
};

type SchoolUser = {
  email: string;
  first_name: string;
  last_name: string;
  user_id: string;
  user_type: UserType;
};

type LongUser = {
  changed_password: boolean;
  email: string;
  first_name: string;
  last_name: string;
  last_time_online: number;
  phone_number: string;
  user_id: string;
  user_type: UserType;
  tags: Tag[] | null | undefined;
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

  let response = await fetch(process.env.BACKEND_URL + "/api/users", {
    method: "GET",
    headers: {
      Authorization: "Bearer " + req.session.user.token,
    },
  });

  if (response.status !== 200) {
    return {
      props: {
        users: [] as SchoolUser[],
        tags: [] as Tag[],
        error: (await response.json()).error,
      },
    };
  }

  const users = (await response.json()) as SchoolUser[];

  // Order by type,  last name, first name
  users.sort((a, b) => {
    if (a.user_type !== b.user_type) {
      return a.user_type - b.user_type;
    }

    if (a.last_name !== b.last_name) {
      return a.last_name.localeCompare(b.last_name);
    }

    return a.first_name.localeCompare(b.first_name);
  });

  response = await fetch(process.env.BACKEND_URL + "/api/tags", {
    method: "GET",
    headers: {
      Authorization: "Bearer " + req.session.user.token,
    },
  });

  if (response.status !== 200) {
    return {
      props: {
        users: [] as SchoolUser[],
        tags: [] as Tag[],
        error: (await response.json()).error,
      },
    };
  }

  const tags = (await response.json()) as Tag[];

  return {
    props: {
      error: null,
      users,
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

function DisplayUserList({
  users,
  setSelectedUser,
  setUserList,
  sessionUser,
  toast,
}: {
  users: SchoolUser[];
  setSelectedUser: Dispatch<SetStateAction<LongUser | null>>;
  setUserList: Dispatch<SetStateAction<SchoolUser[]>>;
  sessionUser: any;
  toast: (options: UseToastOptions) => void;
}) {
  const background = useColorModeValue("gray.100", "gray.700");
  const [search, setSearch] = useState("");

  const { isOpen, onOpen, onClose } = useDisclosure();

  const getStringType = (type: UserType) => {
    switch (type) {
      case UserType.Admin:
        return "Admin";
      case UserType.Teacher:
        return "Teacher";
      case UserType.Student:
        return "Student";
    }
  };

  const getUser = async (user_id: string) => {
    let response = await fetch("http://localhost:3000/api/management/users", {
      method: "GET",
      headers: {
        user_id: user_id,
        Authorization: "Bearer " + sessionUser.token,
      },
    });

    if (response.status !== 200) {
      toast({
        title: "Error",
        description: (await response.json()).error,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    const user = (await response.json()) as LongUser;
    user.tags = [] as Tag[];

    response = await fetch(
      "http://localhost:3000/api/management/personal_tags",
      {
        method: "GET",
        headers: {
          user_id: user_id,
        },
      }
    );

    if (response.status !== 200) {
      toast({
        title: "Error",
        description: (await response.json()).error,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    const tags = (await response.json()) as Tag[];
    user.tags = tags;
    setSelectedUser(user);
  };

  return (
    <Box w="60%" mb="auto">
      <Center mt="20px">
        <Heading>Users List</Heading>
      </Center>

      <Button mt="20px" onClick={onOpen}>
        Add User
      </Button>

      <DisplayCreateUser
        isOpen={isOpen}
        onClose={onClose}
        setUserList={setUserList}
        toast={toast}
      />

      <Input
        mt="20px"
        type="text"
        placeholder="Search"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
        }}
      />

      <TableContainer mt="40px">
        <Table variant="striped" colorScheme="gray">
          <Thead>
            <Tr>
              <Th>First Name</Th>
              <Th>Last Name</Th>
              <Th>Email</Th>
              <Th>User Type</Th>
            </Tr>
          </Thead>
          <Tbody>
            {users
              .filter(
                (user) =>
                  user.first_name
                    .toLowerCase()
                    .includes(search.toLowerCase()) ||
                  user.last_name.toLowerCase().includes(search.toLowerCase()) ||
                  user.email.toLowerCase().includes(search.toLowerCase())
              )
              .map((user) => (
                <Tr
                  key={user.user_id}
                  onClick={() => {
                    getUser(user.user_id);
                  }}
                  _hover={{
                    background,
                    cursor: "pointer",
                  }}
                >
                  <Td>{user.first_name}</Td>
                  <Td>{user.last_name}</Td>
                  <Td>{user.email}</Td>
                  <Td>{getStringType(user.user_type)}</Td>
                </Tr>
              ))}
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  );
}

type FormState = {
  email: string;
  user_type: number | null;
  first_name: string;
  last_name: string;
  phone_number: string;
  error: string;
};

type FormAction = {
  type:
    | "setEmail"
    | "setUserType"
    | "setFirstName"
    | "setLastName"
    | "setPhoneNumber"
    | "setError";
  payload: string | UserType | number;
};

const initialFormState: FormState = {
  email: "",
  user_type: null,
  first_name: "",
  last_name: "",
  phone_number: "",
  error: "",
};

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "setEmail":
      return { ...state, email: action.payload as string };
    case "setUserType":
      // If the type if UserType, then it will be converted to a string
      return { ...state, user_type: action.payload as UserType };
    case "setFirstName":
      return { ...state, first_name: action.payload as string };
    case "setLastName":
      return { ...state, last_name: action.payload as string };
    case "setPhoneNumber":
      return { ...state, phone_number: action.payload as string };
    case "setError":
      return { ...state, error: action.payload as string };
    default:
      return state;
  }
}

function DisplayCreateUser({
  isOpen,
  onClose,
  setUserList,
  toast,
}: {
  isOpen: boolean;
  onClose: () => void;
  setUserList: Dispatch<SetStateAction<SchoolUser[]>>;
  toast: (options: UseToastOptions) => void;
}) {
  const [formState, dispatch] = useReducer(formReducer, initialFormState);

  const createUser = async () => {
    if (
      formState.user_type === null ||
      formState.email === "" ||
      formState.first_name === "" ||
      formState.last_name === ""
    ) {
      toast({
        title: "Error",
        description: "Please fill out all fields",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    let response = await fetch("http://localhost:3000/api/management/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: formState.email,
        type: formState.user_type,
        first_name: formState.first_name,
        last_name: formState.last_name,
        phone_number: formState.phone_number,
      }),
    });

    if (response.status !== 201) {
      toast({
        title: "Error",
        description: (await response.json()).error,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    const user = (await response.json()) as SchoolUser;

    setUserList((prev) => [...prev, user]);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Create User</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl id="email" isRequired>
            <FormLabel>Email</FormLabel>
            <Input
              type="email"
              placeholder="Email"
              value={formState.email}
              onChange={(e) => {
                dispatch({ type: "setEmail", payload: e.target.value });
              }}
            />
          </FormControl>

          <FormControl id="user_type" isRequired>
            <FormLabel>User Type</FormLabel>
            <Select
              placeholder="Select User Type"
              value={formState.user_type}
              onChange={(e) => {
                dispatch({
                  type: "setUserType",
                  payload: intToUserType(parseInt(e.target.value)),
                });
              }}
            >
              <option value={UserType.Admin}>Admin</option>
              <option value={UserType.Teacher}>Teacher</option>
              <option value={UserType.Student}>Student</option>
            </Select>
          </FormControl>

          <FormControl id="first_name" isRequired>
            <FormLabel>First Name</FormLabel>
            <Input
              type="text"
              placeholder="First Name"
              value={formState.first_name}
              onChange={(e) => {
                dispatch({ type: "setFirstName", payload: e.target.value });
              }}
            />
          </FormControl>

          <FormControl id="last_name" isRequired>
            <FormLabel>Last Name</FormLabel>
            <Input
              type="text"
              placeholder="Last Name"
              value={formState.last_name}
              onChange={(e) => {
                dispatch({ type: "setLastName", payload: e.target.value });
              }}
            />
          </FormControl>

          <FormControl id="phone_number" isRequired>
            <FormLabel>Phone Number</FormLabel>
            <Input
              type="text"
              placeholder="Phone Number"
              value={formState.phone_number}
              onChange={(e) => {
                dispatch({ type: "setPhoneNumber", payload: e.target.value });
              }}
            />
          </FormControl>
        </ModalBody>

        <ModalFooter>
          <Button
            colorScheme={
              formState.email !== "" &&
              formState.user_type !== null &&
              formState.first_name !== "" &&
              formState.last_name !== ""
                ? "blue"
                : "red"
            }
            mr={3}
            onClick={() => {
              createUser();
            }}
          >
            Create
          </Button>

          <Button onClick={onClose}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function intToUserType(type: number): UserType {
  const number = parseInt(type.toString());
  switch (number) {
    case 0:
      return UserType.Admin;
    case 1:
      return UserType.Teacher;
    case 2:
      return UserType.Student;
    default:
      return UserType.Student;
  }
}

function AddTags({
  selectedUser,
  setSelectedUser,
  all_tags,
  onClose,
  isOpen,
  toast,
}: {
  selectedUser: LongUser | null;
  setSelectedUser: Dispatch<SetStateAction<LongUser | null>>;
  onClose: () => void;
  isOpen: boolean;
  all_tags: Tag[];
  toast: (options: UseToastOptions) => void;
}) {
  const [possibleTags, setPossibleTags] = useState<Tag[]>(
    all_tags.filter(
      (tag) =>
        !selectedUser.tags.some((current_tag) => current_tag.id === tag.id)
    )
  );
  const [selectedTags, setSelectedTags] = useState<Tag[]>(selectedUser.tags);

  useEffect(() => {
    setPossibleTags(
      all_tags.filter(
        (tag) =>
          !selectedUser.tags.some((current_tag) => current_tag.id === tag.id)
      )
    );
    setSelectedTags(selectedUser.tags);
  }, [selectedUser]);

  const addTags = async () => {
    const response = await fetch(
      "http://localhost:3000/api/management/personal_tags",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: selectedUser.user_id,
          tags: {
            // the tags to add are selected tags that are not in the current tags
            add: selectedTags
              .filter(
                (tag) =>
                  !selectedUser.tags.some(
                    (current_tag) => current_tag.id === tag.id
                  )
              )
              .map((tag) => tag.id),
            // The tags to remove are the current tags that are not in the selected tags
            remove: selectedUser.tags
              .filter(
                (tag) =>
                  !selectedTags.some(
                    (selected_tag) => selected_tag.id === tag.id
                  )
              )
              .map((tag) => tag.id),
          },
        }),
      }
    );

    if (response.status !== 200) {
      toast({
        title: "Error",
        description: "There was an error updating the tags",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
    // Update the user's tags
    setSelectedUser((user) => {
      if (user) {
        return {
          ...user,
          tags: selectedTags,
        };
      }
      return null;
    });
    toast({
      title: "Tags updated",
      description: "The tags have been updated",
      status: "success",
      duration: 5000,
      isClosable: true,
    });

    onClose();
  };

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>Select tags to add</DrawerHeader>

        <DrawerBody>
          {possibleTags.length === 0 && selectedTags.length === 0 ? (
            <Text>No tags to add</Text>
          ) : (
            <VStack h="80%" w="100%">
              <Text fontSize="2xl">Available tags</Text>
              <SimpleGrid
                spacing="10px"
                templateColumns="repeat(auto-fill, minmax(100px, 1fr))"
              >
                {possibleTags.map((tag) => (
                  <Tag
                    key={tag.id}
                    size="lg"
                    colorScheme={tag.colour}
                    variant="solid"
                    cursor="pointer"
                    onClick={() => {
                      setSelectedTags([...selectedTags, tag]);
                      setPossibleTags(
                        possibleTags.filter((t) => t.id !== tag.id)
                      );
                    }}
                  >
                    {tag.name}
                  </Tag>
                ))}
              </SimpleGrid>
              <Spacer />
              <Text fontSize="2xl">Selected Tags</Text>
              <SimpleGrid
                spacing="10px"
                templateColumns="repeat(auto-fill, minmax(100px, 1fr))"
              >
                {selectedTags.map((tag) => (
                  <Tag
                    key={tag.id}
                    colorScheme={tag.colour}
                    variant="solid"
                    cursor="pointer"
                    onClick={() => {
                      setSelectedTags(
                        selectedTags.filter((t) => t.id !== tag.id)
                      );
                      setPossibleTags([...possibleTags, tag]);
                    }}
                  >
                    {tag.name}
                  </Tag>
                ))}
              </SimpleGrid>
            </VStack>
          )}
        </DrawerBody>

        <DrawerFooter>
          <Button variant="outline" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorScheme={selectedTags.length > 0 ? "blue" : "red"}
            onClick={() => {
              addTags();
            }}
          >
            Save
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function DisplayUserDetails({
  selectedUser,
  setSelectedUser,
  setUserList,
  tags,
  toast,
}: {
  selectedUser: LongUser | null;
  setSelectedUser: Dispatch<SetStateAction<LongUser | null>>;
  setUserList: Dispatch<SetStateAction<SchoolUser[]>>;
  tags: Tag[];
  toast: (options: UseToastOptions) => void;
}) {
  const [formState, dispatch] = useReducer(formReducer, initialFormState);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const updateUser = async (user: LongUser) => {
    if (
      !(
        formState.email !== "" ||
        formState.first_name !== "" ||
        formState.last_name !== "" ||
        formState.phone_number !== "" ||
        formState.user_type !== null
      )
    )
      return;
    // Send just the fields that have been updated

    const body = JSON.stringify({
      email:
        formState.email !== "" && formState.email !== selectedUser.email
          ? formState.email
          : null,
      first_name:
        formState.first_name !== "" &&
        formState.first_name !== selectedUser.first_name
          ? formState.first_name
          : null,
      last_name:
        formState.last_name !== "" &&
        formState.last_name !== selectedUser.last_name
          ? formState.last_name
          : null,
      phone_number:
        formState.phone_number !== "" &&
        formState.phone_number !== selectedUser.phone_number
          ? formState.phone_number
          : null,
      user_type: formState.user_type !== null ? formState.user_type : null,
      user_id: selectedUser.user_id,
    });

    const response = await fetch("http://localhost:3000/api/management/users", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body,
    });

    if (response.status !== 200) {
      toast({
        title: "Error",
        description: (await response.json()).error,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    // Update the entry that has the same id in the
    // user list
    setUserList((prev) => {
      const newList = [...prev];
      const index = newList.findIndex(
        (user) => user.user_id === selectedUser.user_id
      );
      newList[index] = {
        ...newList[index],
        email: formState.email !== "" ? formState.email : selectedUser.email,
        first_name:
          formState.first_name !== ""
            ? formState.first_name
            : selectedUser.first_name,
        last_name:
          formState.last_name !== ""
            ? formState.last_name
            : selectedUser.last_name,
        user_type:
          formState.user_type !== null
            ? intToUserType(formState.user_type)
            : selectedUser.user_type,
      };

      return newList;
    });

    toast({
      title: "Success",
      description: "User updated successfully",
      status: "success",
      duration: 5000,
      isClosable: true,
    });
  };

  return (
    <Box w="40%" mb="auto">
      <Center mt="20px">
        <Heading>User Details</Heading>
      </Center>

      {selectedUser === null ? (
        <Box w="50%">
          <Center mt="20px">
            <Text fontSize="2xl">No User Selected</Text>
          </Center>
        </Box>
      ) : (
        <Box p="20px">
          <InputGroup mb="10px">
            <InputLeftAddon w="140px" children="First Name" />
            <Input
              type="text"
              placeholder={selectedUser.first_name}
              onChange={(e) => {
                dispatch({ type: "setFirstName", payload: e.target.value });
              }}
            />
          </InputGroup>

          <InputGroup mb="10px">
            <InputLeftAddon w="140px" children="Last Name" />
            <Input
              type="text"
              placeholder={selectedUser.last_name}
              onChange={(e) => {
                dispatch({ type: "setLastName", payload: e.target.value });
              }}
            />
          </InputGroup>

          <InputGroup mb="10px">
            <InputLeftAddon w="140px" children="Email" />
            <Input
              type="text"
              placeholder={selectedUser.email}
              onChange={(e) => {
                dispatch({ type: "setEmail", payload: e.target.value });
              }}
            />
          </InputGroup>

          <InputGroup mb="10px">
            <InputLeftAddon w="140px" children="User Type" />
            <Select
              value={
                formState.user_type
                  ? formState.user_type
                  : selectedUser.user_type
              }
              onChange={(e) => {
                dispatch({ type: "setUserType", payload: e.target.value });
              }}
            >
              <option value={UserType.Admin}>Admin</option>
              <option value={UserType.Teacher}>Teacher</option>
              <option value={UserType.Student}>Student</option>
            </Select>
          </InputGroup>

          <InputGroup mb="10px">
            <InputLeftAddon w="140px" children="Phone number" />
            <Input
              type="text"
              placeholder={selectedUser.phone_number}
              onChange={(e) => {
                dispatch({ type: "setPhoneNumber", payload: e.target.value });
              }}
            />
          </InputGroup>

          {!selectedUser.changed_password ? (
            <Center>
              <Text fontSize="sm">
                The user has to change the default password!
              </Text>
            </Center>
          ) : null}

          <Box ml="auto">
            <Button
              onClick={() => updateUser(selectedUser)}
              colorScheme={
                formState.email !== "" ||
                formState.first_name !== "" ||
                formState.last_name !== "" ||
                formState.phone_number !== "" ||
                formState.user_type !== null
                  ? "blue"
                  : "red"
              }
            >
              Update
            </Button>
          </Box>

          <Center mt="20px">
            <Heading size="md">Tags</Heading>
          </Center>

          <AddTags
            selectedUser={selectedUser}
            setSelectedUser={setSelectedUser}
            all_tags={tags}
            onClose={onClose}
            isOpen={isOpen}
            toast={toast}
          />

          <Button onClick={onOpen}>
            <Text>Assign tags</Text>
          </Button>

          {selectedUser.tags.length > 0 ? (
            <SimpleGrid
              mt="10px"
              spacing="10px"
              templateColumns="repeat(auto-fill, minmax(100px, 1fr))"
            >
              {selectedUser.tags.map((tag) => (
                <Tag colorScheme={tag.colour} variant="solid">
                  {tag.name}
                </Tag>
              ))}
            </SimpleGrid>
          ) : (
            <Center>
              <Text fontSize="sm">No tags assigned to this user</Text>
            </Center>
          )}
        </Box>
      )}
    </Box>
  );
}

function UserManagementPage({ error, users, tags }: Props) {
  const { user, isLoading } = useUser();
  const [userList, setUserList] = useState<SchoolUser[]>(users);
  const toast = useToast();
  const [tempUser, setTempUser] = useState<LongUser | null>(null);

  if (error || (!isLoading && (!user || !user.token))) {
    toast({
      title: "Error",
      description: error,
      status: "error",
      duration: 5000,
      isClosable: true,
    });
  }

  return (
    <ManagementLayout>
      <HStack w="100%">
        <DisplayUserList
          users={userList}
          setSelectedUser={setTempUser}
          setUserList={setUserList}
          sessionUser={user}
          toast={toast}
        />
        <DisplayUserDetails
          selectedUser={tempUser}
          setSelectedUser={setTempUser}
          setUserList={setUserList}
          tags={tags}
          toast={toast}
        />
      </HStack>
    </ManagementLayout>
  );
}

export default UserManagementPage;
