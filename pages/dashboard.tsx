import {
  Button,
  Center,
  HStack,
  Heading,
  Input,
  InputGroup,
  InputLeftAddon,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { UserType, iron_api_options } from "../lib/session";
import Layout from "../components/Layout";
import { useReducer, useState } from "react";
import { withIronSessionSsr } from "iron-session/next";
import { GetServerSideProps } from "next";

type User = {
  changed_password: boolean;
  email: string;
  first_name: string;
  last_name: string;
  last_time_online: number;
  phone_number: string;
  user_id: string;
  user_type: UserType;
};

type Props = {
  user: User;
  error: string;
};

type FormState = {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  error: string;
  reset: number;
};

type FormAction = {
  type:
    | "setEmail"
    | "setPassword"
    | "setFirstName"
    | "setLastName"
    | "setPhoneNumber"
    | "setError"
    | "reset";
  payload: string | UserType | number;
};

const initialFormState: FormState = {
  email: "",
  password: "",
  first_name: "",
  last_name: "",
  phone_number: "",
  error: "",
  reset: 0,
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

  const response = await fetch(
    process.env.BACKEND_URL + "/api/users/" + req.session.user.user_id,
    {
      method: "GET",
      headers: {
        Authorization: "Bearer " + req.session.user.token,
      },
    }
  );

  if (response.status !== 200) {
    const error = await response.json();

    return {
      props: {
        user: null,
        error: error.error,
      },
    };
  }

  const user = (await response.json()) as User;

  return {
    props: {
      user,
      error: null,
    },
  };
};

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "setEmail":
      return { ...state, email: action.payload as string };
    case "setPassword":
      return { ...state, password: action.payload as string };
    case "setFirstName":
      return { ...state, first_name: action.payload as string };
    case "setLastName":
      return { ...state, last_name: action.payload as string };
    case "setPhoneNumber":
      return { ...state, phone_number: action.payload as string };
    case "setError":
      return { ...state, error: action.payload as string };
    case "reset": {
      return initialFormState;
    }
    default:
      return state;
  }
}

export const getServerSideProps = withIronSessionSsr(ssp, iron_api_options);

export default function Dashboard({ user, error }: Props) {
  const [formState, dispatch] = useReducer(formReducer, initialFormState);
  const [currentUser, setCurrentUser] = useState<User>(user);
  const toast = useToast();

  const sendUpdateUser = async () => {
    const response = await fetch("http://localhost:3000/api/management/users", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: formState.email !== "" ? formState.email : null,
        password: formState.password !== "" ? formState.password : null,
        first_name: formState.first_name !== "" ? formState.first_name : null,
        last_name: formState.last_name !== "" ? formState.last_name : null,
        phone_number:
          formState.phone_number !== "" ? formState.phone_number : null,
        user_id: currentUser.user_id,
      }),
    });

    if (response.status !== 200) {
      const error = await response.json();
      toast({
        title: "Error",
        description: error.error,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    dispatch({ type: "reset", payload: 0 });
    toast({
      title: "Success",
      description: "User updated successfully",
      status: "success",
      duration: 5000,
      isClosable: true,
    });

    if (formState.email !== "") {
      setCurrentUser({ ...currentUser, email: formState.email });
    }
    if (formState.first_name !== "") {
      setCurrentUser({ ...currentUser, first_name: formState.first_name });
    }
    if (formState.last_name !== "") {
      setCurrentUser({ ...currentUser, last_name: formState.last_name });
    }
    if (formState.phone_number !== "") {
      setCurrentUser({ ...currentUser, phone_number: formState.phone_number });
    }
    if (formState.password !== "") {
      setCurrentUser({ ...currentUser, changed_password: true });
    }
  };

  if (error) {
    return (
      <Layout>
        <Center mt="20px">
          <Heading color="red">{error}</Heading>
        </Center>
      </Layout>
    );
  }

  return (
    <Layout>
      <Center>
        <Heading>Dashboard</Heading>
      </Center>

      <VStack w="30%" ml="35%" spacing="20px" mt="40px">
        <InputGroup>
          <InputLeftAddon w="140px" children="First Name" />
          <Input
            type="text"
            placeholder={currentUser.first_name}
            onChange={(e) =>
              dispatch({ type: "setFirstName", payload: e.target.value })
            }
          />
        </InputGroup>

        <InputGroup>
          <InputLeftAddon w="140px" children="Last Name" />
          <Input
            type="text"
            placeholder={currentUser.last_name}
            onChange={(e) =>
              dispatch({ type: "setLastName", payload: e.target.value })
            }
          />
        </InputGroup>

        <InputGroup>
          <InputLeftAddon w="140px" children="Phone Number" />
          <Input
            type="text"
            placeholder={currentUser.phone_number}
            onChange={(e) =>
              dispatch({ type: "setPhoneNumber", payload: e.target.value })
            }
          />
        </InputGroup>

        <InputGroup>
          <InputLeftAddon w="140px" children="Email" />
          <Input
            type="text"
            placeholder={currentUser.email}
            onChange={(e) =>
              dispatch({ type: "setEmail", payload: e.target.value })
            }
          />
        </InputGroup>

        <InputGroup>
          <InputLeftAddon w="140px" children="Password" />
          <Input
            type="password"
            placeholder="********"
            onChange={(e) =>
              dispatch({ type: "setPassword", payload: e.target.value })
            }
          />
        </InputGroup>
      </VStack>

      <Center mt="20px">
        <HStack spacing="20px">
          <Button
            w="100px"
            h="40px"
            colorScheme="green"
            isDisabled={
              formState.email === "" &&
              formState.password === "" &&
              formState.first_name === "" &&
              formState.last_name === "" &&
              formState.phone_number === ""
            }
            borderRadius="10px"
            textAlign="center"
            pt="10px"
            cursor="pointer"
            onClick={() => {
              sendUpdateUser();
            }}
          >
            Save
          </Button>
          <Button
            w="100px"
            h="40px"
            colorScheme="red"
            borderRadius="10px"
            textAlign="center"
            pt="10px"
            cursor="pointer"
            onClick={() => {
              dispatch({ type: "reset", payload: 0 });
            }}
          >
            Cancel
          </Button>
        </HStack>
      </Center>
    </Layout>
  );
}
