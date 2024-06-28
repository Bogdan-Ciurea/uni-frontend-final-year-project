import { GetServerSideProps } from "next";
import Layout from "../../components/Layout";
import { UserType, iron_api_options } from "../../lib/session";
import {
  Box,
  Button,
  Center,
  Flex,
  Heading,
  Input,
  Text,
  useToast,
} from "@chakra-ui/react";
import { withIronSessionSsr } from "iron-session/next";
import { useReducer } from "react";

type Props = {
  error: string;
};

const ssp: GetServerSideProps<Props> = async ({ req, params }) => {
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

  return {
    props: {
      error: "",
    },
  };
};

export const getServerSideProps = withIronSessionSsr(ssp, iron_api_options);

type FormState = {
  name: string;
  start_date: Date | null;
  end_date: Date | null;
  thumbnail: File | null;
  error: string;
};

type FormAction = {
  type: "setName" | "setStartDate" | "setEndDate" | "setThumbnail" | "setError";
  payload: string | File | null;
};

const initialFormState: FormState = {
  name: "",
  start_date: null,
  end_date: null,
  thumbnail: null,
  error: "",
};

const reducer = (state: FormState, action: FormAction): FormState => {
  switch (action.type) {
    case "setName":
      return { ...state, name: action.payload as string };
    case "setStartDate":
      return { ...state, start_date: new Date(action.payload as string) };
    case "setEndDate":
      return { ...state, end_date: new Date(action.payload as string) };
    case "setThumbnail":
      return { ...state, thumbnail: action.payload as File };
    case "setError":
      return { ...state, error: action.payload as string };
    default:
      return state;
  }
};

export default function CreateCoursePage({ error }: Props) {
  const toast = useToast();
  const [state, dispatch] = useReducer(reducer, initialFormState);

  if (error || state.error) {
    toast({
      title: "Error",
      description: error ? error : state.error,
      status: "error",
      duration: 9000,
      isClosable: true,
    });
  }

  const createCourse = async () => {
    if (!state.end_date || !state.name || !state.start_date || !state.thumbnail)
      return;

    const formData = new FormData();
    formData.append("name", state.name);
    formData.append(
      "start_date",
      Math.trunc(state.start_date.getTime().valueOf() / 1000).toString()
    );
    formData.append(
      "end_date",
      Math.trunc(state.end_date.getTime().valueOf() / 1000).toString()
    );
    formData.append("file", state.thumbnail);

    const res = await fetch("/api/course/create", {
      method: "POST",
      body: formData,
    });

    if (res.status !== 201) {
      const data = await res.json();
      dispatch({ type: "setError", payload: data.error });
    } else {
      toast({
        title: "Success",
        description: "Course created successfully",
        status: "success",
        duration: 9000,
        isClosable: true,
      });
    }
  };

  return (
    <Layout>
      <Center mt="20px">
        <Heading> Create Course </Heading>
      </Center>

      <Box>
        <Center mt="20px">
          <Flex w="400px">
            <Text mt="5px" mr="20px">
              Name
            </Text>
            <Input
              w="300px"
              placeholder="name"
              onChange={(e) => {
                dispatch({ type: "setName", payload: e.target.value });
              }}
            />
          </Flex>
        </Center>
        <Center mt="20px">
          <Flex w="400px">
            <Text mt="5px" mr="20px">
              Start Date
            </Text>
            <Input
              w="auto"
              type="date"
              placeholder="start date"
              onChange={(e) => {
                dispatch({ type: "setStartDate", payload: e.target.value });
              }}
            />
          </Flex>
        </Center>
        <Center mt="20px">
          <Flex w="400px">
            <Text mt="5px" mr="20px">
              End Date
            </Text>
            <Input
              w="auto"
              type="date"
              placeholder="end date"
              onChange={(e) => {
                dispatch({ type: "setEndDate", payload: e.target.value });
              }}
            />
          </Flex>
        </Center>
        <Center mt="20px">
          <Flex w="400px">
            <Text mt="5px" mr="20px">
              Thumbnail
            </Text>
            <Input
              type="file"
              placeholder="thumbnail"
              onChange={(e) => {
                dispatch({ type: "setThumbnail", payload: e.target.files[0] });
              }}
            />
          </Flex>
        </Center>
      </Box>

      <Center mt="20px">
        <Button
          colorScheme={
            state.end_date && state.name && state.start_date && state.thumbnail
              ? "green"
              : "red"
          }
          isDisabled={
            !state.end_date ||
            !state.name ||
            !state.start_date ||
            !state.thumbnail
          }
          onClick={createCourse}
        >
          <Text>Create</Text>
        </Button>
      </Center>
    </Layout>
  );
}
