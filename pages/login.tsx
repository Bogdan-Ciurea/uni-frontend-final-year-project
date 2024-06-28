import React, { FormEventHandler, useReducer } from "react";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Avatar,
  Box,
  Flex,
  InputGroup,
  InputLeftElement,
  Select,
  Stack,
} from "@chakra-ui/react";
import { chakra, Heading, FormControl, Button, Input } from "@chakra-ui/react";
import { FaUserAlt, FaLock } from "react-icons/fa";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { withIronSessionSsr } from "iron-session/next";
import { iron_api_options } from "../lib/session";
import Layout from "../components/Layout";

const CFaUserAlt = chakra(FaUserAlt);
const CFaLock = chakra(FaLock);

type School = {
  id: number;
  name: string;
  country_id: number;
};

type Props = {
  schools: School[];
};

const ssp: GetServerSideProps<Props> = async ({ req }) => {
  if (req.session && req.session.user && req.session.user.token) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  const response = await fetch(
    process.env.BACKEND_URL + "/api/environment/school"
  );
  const schools = (await response.json()) as School[];

  return {
    props: {
      schools,
    },
  };
};

export const getServerSideProps = withIronSessionSsr(ssp, iron_api_options);

type FormState = {
  email: string;
  password: string;
  school: School | undefined;
  error: string;
};

type FromAction = {
  type: "error" | "setEmail" | "setPassword" | "setSchool";
  payload?: string | School;
};

const initialFormState: FormState = {
  email: "",
  password: "",
  school: undefined,
  error: "",
};

const reducer = (state: FormState, action: FromAction): FormState => {
  switch (action.type) {
    case "setEmail":
      return {
        ...state,
        email: typeof action.payload === "string" ? action.payload : "",
      };
    case "setPassword":
      return {
        ...state,
        password: typeof action.payload === "string" ? action.payload : "",
      };
    case "setSchool":
      return {
        ...state,
        school: typeof action.payload === "object" ? action.payload : undefined,
      };
    case "error":
      return {
        ...state,
        error:
          typeof action.payload === "string"
            ? action.payload
            : "An unknown error occurred.",
      };
    default:
      return state;
  }
};

function Login({ schools }: Props) {
  const [state, dispatch] = useReducer(reducer, initialFormState);
  const router = useRouter();

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    const data = {
      email: state.email,
      password: state.password,
      school_id: state.school?.id,
    };

    const response = await fetch("http://localhost:3000/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    const response_json = await response.json();

    if (response.status === 200) {
      router.push("/");
    } else {
      dispatch({ type: "error", payload: response_json.error });
    }
  };

  return (
    <Layout>
      <Flex
        flexDirection="column"
        width="100%"
        height="82vh"
        bg="bg-surface-dark"
        justifyContent="center"
        alignItems="center"
      >
        <Stack flexDir="column" justifyContent="center" alignItems="center">
          <Avatar bg="teal.500" />
          <Heading color="teal.500">Login</Heading>
          <Box minW={{ base: "90%", md: "468px" }}>
            <form onSubmit={handleSubmit}>
              <Stack spacing={4} boxShadow="md">
                <FormControl
                  marginTop="40px"
                  marginLeft="20px"
                  width="calc(100% - 40px)"
                >
                  <Select
                    placeholder="Select school"
                    onChange={(e) =>
                      dispatch({
                        type: "setSchool",
                        payload: schools.find(
                          (school) => school.id === parseInt(e.target.value)
                        ),
                      })
                    }
                  >
                    {schools.map((school) => (
                      <option key={school.id} value={school.id}>
                        {school.name}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl>
                  <InputGroup
                    margin="10px"
                    marginLeft="20px"
                    width="calc(100% - 40px)"
                  >
                    <InputLeftElement
                      pointerEvents="none"
                      children={<CFaUserAlt color="gray.300" />}
                    />
                    <Input
                      type="email"
                      placeholder="email address"
                      value={state.email}
                      onChange={(e) =>
                        dispatch({ type: "setEmail", payload: e.target.value })
                      }
                    />
                  </InputGroup>
                </FormControl>
                <FormControl>
                  <InputGroup
                    marginBottom="20px"
                    marginLeft="20px"
                    width="calc(100% - 40px)"
                  >
                    <InputLeftElement
                      pointerEvents="none"
                      children={<CFaLock color="gray.300" />}
                    />
                    <Input
                      type="password"
                      placeholder="password"
                      value={state.password}
                      onChange={(e) =>
                        dispatch({
                          type: "setPassword",
                          payload: e.target.value,
                        })
                      }
                    />
                  </InputGroup>
                </FormControl>

                <Button
                  colorScheme="teal"
                  variant="solid"
                  type="submit"
                  value="Login"
                >
                  {" "}
                  Login{" "}
                </Button>
                {state.error && (
                  <Alert status="error">
                    <AlertIcon />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{state.error}</AlertDescription>
                  </Alert>
                )}
              </Stack>
            </form>
          </Box>
        </Stack>
      </Flex>
    </Layout>
  );
}

export default Login;
