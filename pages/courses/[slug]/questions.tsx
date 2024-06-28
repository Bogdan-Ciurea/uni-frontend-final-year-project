import { GetServerSideProps } from "next";
import { Course } from "../index";
import { User, UserType, iron_api_options } from "../../../lib/session";
import { withIronSessionSsr } from "iron-session/next";
import Layout from "../../../components/Layout";
import {
  Accordion,
  AccordionButton,
  AccordionItem,
  Box,
  Button,
  Center,
  Flex,
  Heading,
  Link,
  Spacer,
  AccordionIcon,
  Text,
  AccordionPanel,
  Tag,
  Avatar,
  TagLabel,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalHeader,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  Input,
  useToast,
  UseToastOptions,
} from "@chakra-ui/react";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import useUser from "../../../hooks/useUser";
import { DeleteIcon } from "@chakra-ui/icons";

type Answer = {
  content: string;
  created_at: number;
  created_by_user_name: string;
  created_by_user_id: string;
  id: string;
  question_id: string;
};

type Question = {
  answers: Answer[];
  content: string;
  created_at: number;
  created_by_user_name: string;
  created_by_user_id: string;
  id: string;
};

type Props = {
  error: string;
  course: Course;
  course_questions: Question[];
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

  let response = await fetch(
    process.env.BACKEND_URL + "/api/course/" + params.slug,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + req.session.user.token,
      },
    }
  );

  if (response.status !== 200) {
    return {
      props: {
        error: (
          (await response.json()) as {
            error: string;
          }
        ).error,
        course: null,
        course_questions: null,
      },
    };
  }

  const course = (await response.json()) as Course;

  response = await fetch(
    process.env.BACKEND_URL + "/api/course/" + params.slug + "/questions",
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + req.session.user.token,
      },
    }
  );

  if (response.status !== 200) {
    return {
      props: {
        error: (
          (await response.json()) as {
            error: string;
          }
        ).error,
        course: null,
        course_questions: null,
      },
    };
  }

  const course_questions = (await response.json()) as Question[];

  return {
    props: {
      error: null,
      course,
      course_questions,
    },
  };
};

export const getServerSideProps = withIronSessionSsr(ssp, iron_api_options);

function CourseLayout({
  children,
  course,
  user,
}: {
  children: any;
  course: Course;
  user: User;
}) {
  // Have a left sidebar with links to files and questions
  return (
    <Layout>
      <Flex width="100%">
        <Box width="25%">
          <Center>
            <Heading mt="30px">Links</Heading>
          </Center>
          <Center>
            <Link href={"/courses/" + course.id + "/files"}>
              <Text mt="30px">Files</Text>
            </Link>
          </Center>
          <Center>
            <Link href={"/courses/" + course.id + "/questions"}>
              <Text mt="30px">Questions</Text>
            </Link>
          </Center>
          {user.user_type !== UserType.Student ? (
            <Center>
              <Link href={"/courses/" + course.id + "/grades"}>
                <Text mt="30px">Grades</Text>
              </Link>
            </Center>
          ) : null}
          {user.user_type !== UserType.Student ? (
            <Center>
              <Link href={"/courses/" + course.id + "/management"}>
                <Text mt="30px">Management</Text>
              </Link>
            </Center>
          ) : null}
        </Box>
        <Box width="75%">
          <Center mr="25%">
            <Heading mt="30px">{course.name}</Heading>
          </Center>
          {children}
        </Box>
      </Flex>
    </Layout>
  );
}

function AddQuestion({
  course_id,
  setQuestions,
  toast,
}: {
  course_id: string;
  setQuestions: Dispatch<SetStateAction<Question[]>>;
  toast: (props: UseToastOptions) => void;
}) {
  const [questionContent, setQuestionContent] = useState("");

  const handleCreate = async () => {
    if (questionContent === "") {
      return;
    }

    const response = await fetch("http://localhost:3000/api/course/questions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        course_id,
        question_content: questionContent,
      }),
    });

    if (response.status !== 201) {
      const error = (await response.json()) as { error: string };
      toast({
        title: "Error",
        description: error.error,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    const question = (await response.json()) as Question;

    setQuestions((questions) => {
      return [...questions, question];
    });
  };

  return (
    <Box>
      <Input
        mt="20px"
        mb="20px"
        value={questionContent}
        onChange={(e) => setQuestionContent(e.target.value)}
      />
      <Button onClick={handleCreate}>Create</Button>
    </Box>
  );
}

function AddAnswer({
  course_id,
  question_id,
  setAnswers,
  onClose,
  toast,
}: {
  course_id: string;
  question_id: string;
  setAnswers: Dispatch<SetStateAction<Answer[]>>;
  onClose: () => void;
  toast: (props: UseToastOptions) => void;
}) {
  const [answerContent, setAnswerContent] = useState("");

  const handleCreate = async () => {
    if (answerContent === "") {
      return;
    }

    const response = await fetch("http://localhost:3000/api/course/answers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        course_id,
        answer_content: answerContent,
        question_id,
      }),
    });

    if (response.status !== 201) {
      const error = (await response.json()) as { error: string };
      toast({
        title: "Error",
        description: error.error,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    const answer = (await response.json()) as Answer;

    setAnswers((answers) => {
      return [...answers, answer];
    });

    onClose();
  };

  return (
    <Box>
      <Input
        mt="20px"
        mb="20px"
        value={answerContent}
        onChange={(e) => setAnswerContent(e.target.value)}
      />
      <Button onClick={handleCreate}>Create</Button>
    </Box>
  );
}

function DisplayAnswer({
  answer,
  setAnswers,
  course_id,
  question_id,
  user,
  toast,
}: {
  answer: Answer;
  setAnswers: Dispatch<SetStateAction<Answer[]>>;
  course_id: string;
  question_id: string;
  user: User;
  toast: (props: UseToastOptions) => void;
}) {
  const string_date = new Date(answer.created_at * 1000).toLocaleString();

  const deleteAnswer = async () => {
    const response = await fetch("http://localhost:3000/api/course/answers/", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        course_id,
        question_id,
        answer_id: answer.id,
      }),
    });

    if (response.status !== 200) {
      const error = (await response.json()) as { error: string };
      toast({
        title: "Error",
        description: error.error,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setAnswers((answers) => {
      return answers.filter((a) => a.id !== answer.id);
    });
  };

  return (
    <Box mb="20px">
      <Flex w="100%">
        <Box mr="10px">
          <Tag colorScheme="red" borderRadius="full">
            <Avatar boxSize="1.75em" name={answer.created_by_user_name} />
          </Tag>
        </Box>
        <Box width="90%">
          <Flex>
            <Text fontWeight="bold">{answer.created_by_user_name}</Text>
            <Text ml="10px" color="gray.500">
              {string_date}
            </Text>
          </Flex>
          <Text>{answer.content}</Text>
        </Box>
        <Spacer />
        {user.user_id === answer.created_by_user_id ||
        user.user_type === UserType.Admin ? (
          <Button
            colorScheme="red"
            onClick={async () => {
              deleteAnswer();
            }}
          >
            <DeleteIcon />
          </Button>
        ) : (
          <></>
        )}
      </Flex>
    </Box>
  );
}

function DisplayQuestion({
  question,
  setQuestions,
  user,
  course_id,
  toast,
}: {
  question: Question;
  setQuestions: Dispatch<SetStateAction<Question[]>>;
  user: User;
  course_id: string;
  toast: (props: UseToastOptions) => void;
}) {
  const string_date = new Date(question.created_at * 1000).toLocaleString();
  const [answers, setAnswers] = useState(question.answers);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const deleteQuestion = async () => {
    const response = await fetch("http://localhost:3000/api/course/questions", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + user.token,
      },
      body: JSON.stringify({
        question_id: question.id,
        course_id,
      }),
    });

    if (response.status !== 200) {
      const error = (await response.json()) as { error: string };
      toast({
        title: "Error",
        description: error.error,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setQuestions((questions) => {
      return questions.filter((qsn) => qsn.id !== question.id);
    });
  };

  useEffect(() => {
    setQuestions((questions) => {
      return questions.map((qsn) => {
        if (qsn.id === question.id) {
          return {
            ...qsn,
            answers,
          };
        }
        return qsn;
      });
    });
  }, [answers]);

  return (
    <Box mt="30px" mb="30px">
      <Flex>
        <Heading size="md">{question.content}</Heading>
        <Spacer />
        <Text>{string_date}</Text>
      </Flex>
      <Box mt="20px" mb="20px">
        {/* this is the content */}
        <Text>{question.content}</Text>
      </Box>
      <Flex mb="20px">
        <Tag colorScheme="red" borderRadius="full">
          <Avatar
            size="xs"
            name={question.created_by_user_name}
            ml={-1}
            mr={2}
          />
          <TagLabel>{question.created_by_user_name}</TagLabel>
        </Tag>
        <Spacer />
        {user.user_type !== UserType.Student ||
        user.user_id === question.created_by_user_id ? (
          <Button onClick={deleteQuestion} colorScheme="red">
            <DeleteIcon />
          </Button>
        ) : (
          <></>
        )}
      </Flex>
      <Box>
        {/* this is the answers */}
        <Accordion defaultIndex={[0]} allowMultiple>
          <AccordionItem>
            <h2>
              <AccordionButton>
                <Box as="span" flex="1" textAlign="left">
                  <Text fontSize="xl">Answers</Text>
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4}>
              <Button mb="20px" onClick={onOpen} colorScheme="blue">
                Add Answer
              </Button>
              {question.answers.map((answer) => (
                <DisplayAnswer
                  answer={answer}
                  setAnswers={setAnswers}
                  course_id={course_id}
                  question_id={question.id}
                  user={user}
                  toast={toast}
                />
              ))}
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      </Box>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add Answer</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <AddAnswer
              question_id={question.id}
              course_id={course_id}
              setAnswers={setAnswers}
              onClose={onClose}
              toast={toast}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}

export default function DrawQuestionPage({
  error,
  course,
  course_questions,
}: Props) {
  const [questions, setQuestions] = useState<Question[]>(course_questions);
  const { user } = useUser();
  const toast = useToast();

  if ((error && error !== "No questions in the course") || !user || !course) {
    return (
      <Layout>
        <Center>
          <Heading>{error}</Heading>
        </Center>
      </Layout>
    );
  }

  return (
    <CourseLayout course={course} user={user}>
      <Center mr="25%">
        <Heading mt="30px">Questions</Heading>
      </Center>
      <Box w="75%">
        <AddQuestion
          course_id={course.id}
          setQuestions={setQuestions}
          toast={toast}
        />
      </Box>
      <Box width="75%">
        {questions.map((question) => (
          <DisplayQuestion
            toast={toast}
            question={question}
            user={user}
            setQuestions={setQuestions}
            course_id={course.id}
          />
        ))}
      </Box>
    </CourseLayout>
  );
}
