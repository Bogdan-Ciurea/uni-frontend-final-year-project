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
  AccordionIcon,
  Text,
  AccordionPanel,
  Input,
  SimpleGrid,
  Select,
  InputGroup,
  InputRightElement,
  useToast,
  UseToastOptions,
} from "@chakra-ui/react";
import {
  Dispatch,
  SetStateAction,
  useEffect,
  useReducer,
  useState,
} from "react";
import useUser from "../../../hooks/useUser";
import { DeleteIcon } from "@chakra-ui/icons";

type Grade = {
  course_id: string;
  created_at: number;
  evaluated_id: string;
  evaluated_name: string;
  evaluator_id: string;
  evaluator_name: string;
  grade: number;
  id: string;
  out_of: number;
  weight: number;
};

type CourseStudent = {
  first_name: string;
  last_name: string;
  user_id: string;
  type: UserType;
};

type StudentGrades = {
  student_name: string;
  student_id: string;
  grades: Grade[];
};

type Props = {
  error: string;
  course: Course;
  grades: StudentGrades[];
  course_students: CourseStudent[];
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
        grades: null,
        course_students: null,
      },
    };
  }

  const course = (await response.json()) as Course;

  response = await fetch(
    process.env.BACKEND_URL + "/api/course/" + params.slug + "/grades",
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
        grades: null,
        course_students: null,
      },
    };
  }

  let course_grades = (await response.json())["grades"] as Grade[];
  if (course_grades === null || course_grades === undefined) {
    course_grades = [] as Grade[];
  }

  // the course_grades is a list of grades. We want to group them by student
  let users_grades: StudentGrades[] = [];
  if (course_grades.length !== 0) {
    course_grades.forEach((grade) => {
      let student_grades = users_grades.find(
        (student_grades) => student_grades.student_id === grade.evaluated_id
      );
      if (student_grades) {
        student_grades.grades.push(grade);
      } else {
        users_grades.push({
          student_name: grade.evaluated_name,
          student_id: grade.evaluated_id,
          grades: [grade],
        });
      }
    });
  }

  response = await fetch(
    process.env.BACKEND_URL + "/api/course/" + params.slug + "/users",
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
        grades: null,
        course_students: null,
      },
    };
  }

  let course_students = (await response.json()) as CourseStudent[];

  if (course_students === null || course_students === undefined) {
    course_students = [] as CourseStudent[];
  }

  return {
    props: {
      error: null,
      course,
      grades: users_grades,
      course_students,
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

function GradeBox({
  grade,
  user,
  set_student_grades,
  toast,
}: {
  grade: Grade;
  user: User;
  set_student_grades: Dispatch<SetStateAction<Grade[]>>;
  toast: (props: UseToastOptions) => void;
}) {
  // const string_date = new Date(grade.created_at * 1000).toLocaleString();

  const deleteGrade = async () => {
    const response = await fetch("http://localhost:3000/api/course/grades", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grade_id: grade.id,
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

    set_student_grades((student_grades) => {
      return student_grades.filter((g) => g.id !== grade.id);
    });
  };

  return (
    <Box>
      <Center>
        <Text mt="20px" fontSize="xl">
          {grade.grade} out of {grade.out_of}
        </Text>
      </Center>
      <Center>
        {grade.weight !== 0.0 ? (
          <Text mt="20px">Weight: {grade.weight * 100} %</Text>
        ) : null}
      </Center>
      <Text fontSize="xs">Assigned by: {grade.evaluator_name}</Text>
      {/* <Text fontSize="xs">Assigned on: {string_date}</Text> */}
      {grade.evaluator_id === grade.evaluated_id ||
      user.user_type === UserType.Admin ? (
        <Button
          mt="10px"
          colorScheme="red"
          onClick={async () => {
            await deleteGrade();
          }}
        >
          <DeleteIcon />
        </Button>
      ) : null}
    </Box>
  );
}

function StudentGradeBox({
  student_grades,
  user,
  setGrades,
  toast,
}: {
  student_grades: StudentGrades;
  user: User;
  setGrades: Dispatch<SetStateAction<StudentGrades[]>>;
  toast: (props: UseToastOptions) => void;
}) {
  let final_grade = 0;
  let total_weight = 0;
  let out_of_max = 0;

  const [grades, setStudentGrades] = useState<Grade[]>(student_grades.grades);

  useEffect(() => {
    setGrades((prev) => {
      let new_grades = prev.map((student_grades) => {
        if (student_grades.student_id === student_grades.student_id) {
          return {
            student_name: student_grades.student_name,
            student_id: student_grades.student_id,
            grades: grades,
          };
        } else {
          return student_grades;
        }
      });
      return new_grades;
    });
  }, [grades]);

  student_grades.grades.forEach((grade) => {
    if (grade.weight !== -1.0) {
      final_grade += grade.grade * grade.weight;
      total_weight += grade.weight;
    }
    out_of_max += grade.out_of;
  });

  student_grades.grades.forEach((grade) => {
    if (grade.weight === 0.0) {
      final_grade += grade.grade * (1 - total_weight);
    }
  });

  return (
    <Box>
      <Center>
        <Text fontSize="2xl">{student_grades.student_name}</Text>
      </Center>

      <Center>
        <Text fontSize="xl">Final Grade</Text>
      </Center>
      <Center>
        <Text fontSize="xl">
          {final_grade} out of {out_of_max}
        </Text>
      </Center>
      <Center>
        <Text fontSize="small"> {(final_grade / out_of_max) * 100} % </Text>
      </Center>

      {student_grades.grades.length === 0 ? (
        <Text>No grades yet</Text>
      ) : (
        <Accordion allowMultiple>
          <AccordionItem>
            <h2>
              <AccordionButton>
                <Box as="span" flex="1" textAlign="left">
                  <Text fontSize="xl">Grades</Text>
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4}>
              {grades.map((grade) => {
                return (
                  <GradeBox
                    grade={grade}
                    user={user}
                    set_student_grades={setStudentGrades}
                    toast={toast}
                  />
                );
              })}
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      )}
    </Box>
  );
}

type FormState = {
  grade: number;
  out_of: number;
  weight: number;
  student_id: CourseStudent | undefined;
  error: string;
};

type FormAction = {
  type: "setGrade" | "setOutOf" | "setWeight" | "setStudent" | "error";
  payload: number | CourseStudent | string;
};

const initialFormState: FormState = {
  grade: 0,
  out_of: 0,
  weight: 0,
  student_id: undefined,
  error: "",
};

const reducer = (state: FormState, action: FormAction): FormState => {
  switch (action.type) {
    case "setGrade":
      return { ...state, grade: action.payload as number };
    case "setOutOf":
      return { ...state, out_of: action.payload as number };
    case "setWeight":
      return { ...state, weight: action.payload as number };
    case "setStudent":
      return { ...state, student_id: action.payload as CourseStudent };
    case "error":
      return { ...state, error: action.payload as string };
    default:
      return state;
  }
};

function CreateGrade({
  setCourseGrades,
  course_students,
  user,
  course_id,
  toast,
}: {
  setCourseGrades: Dispatch<SetStateAction<StudentGrades[]>>;
  course_students: CourseStudent[];
  user: User;
  course_id: string;
  toast: (props: UseToastOptions) => void;
}) {
  const [state, dispatch] = useReducer(reducer, initialFormState);

  const createGrade = async () => {
    if (state.student_id === undefined) {
      dispatch({ type: "error", payload: "Please select a student" });
      return;
    }

    const response = await fetch("http://localhost:3000/api/course/grades/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grade: state.grade,
        out_of: state.out_of,
        weight: state.weight,
        course_id: course_id,
        user_id: state.student_id.user_id,
      }),
    });

    if (response.status !== 201) {
      const error = (await response.json()) as { error: string };
      dispatch({ type: "error", payload: "Failed to create grade" });
      toast({
        title: "Failed to create grade",
        description: error.error,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    const grade = (await response.json()) as Grade;

    setCourseGrades((prev) => {
      let new_grades = prev.map((student_grades) => {
        if (student_grades.student_id === state.student_id?.user_id) {
          return {
            student_name: student_grades.student_name,
            student_id: student_grades.student_id,
            grades: [...student_grades.grades, grade],
          };
        } else {
          return student_grades;
        }
      });
      return new_grades;
    });

    dispatch({ type: "error", payload: "" });
    dispatch({ type: "setGrade", payload: 0 });
    dispatch({ type: "setOutOf", payload: 0 });
    dispatch({ type: "setWeight", payload: 0 });
    dispatch({ type: "setStudent", payload: undefined });
  };

  return (
    <Box>
      <Center mb="20px">
        <Text fontSize="2xl">Create Grade</Text>
      </Center>
      <Input
        type="number"
        placeholder="Grade"
        onChange={(e) => {
          dispatch({ type: "setGrade", payload: parseInt(e.target.value) });
        }}
      />
      <Input
        mt="20px"
        mb="20px"
        type="number"
        placeholder="Out of"
        onChange={(e) => {
          dispatch({ type: "setOutOf", payload: parseInt(e.target.value) });
        }}
      />
      <InputGroup>
        <Input
          type="number"
          placeholder="Weight in %"
          onChange={(e) => {
            dispatch({ type: "setWeight", payload: parseInt(e.target.value) });
          }}
        />
        <InputRightElement children="%" />
      </InputGroup>
      <Select
        mt="20px"
        mb="20px"
        placeholder="Select Student"
        onChange={(e) => {
          dispatch({
            type: "setStudent",
            payload: course_students.find(
              (student) => student.user_id === e.target.value
            ),
          });
        }}
      >
        {course_students.map((student) => {
          if (
            student.user_id === user.user_id ||
            student.type !== UserType.Student
          ) {
            return null;
          }
          return (
            <option value={student.user_id}>
              {student.first_name} {student.last_name}
            </option>
          );
        })}
      </Select>
      <Center>
        <Button
          onClick={async () => {
            if (
              state.grade === 0 ||
              state.out_of === 0 ||
              state.student_id === undefined
            ) {
              dispatch({
                type: "error",
                payload: "Please fill out all fields",
              });
            } else {
              await createGrade();
            }
          }}
        >
          Create Grade
        </Button>
      </Center>

      <Text>{state.error}</Text>
    </Box>
  );
}

export default function DisplayGradePage({
  error,
  course,
  grades,
  course_students,
}: Props) {
  const { user } = useUser();
  const [courseGrades, setCourseGrades] = useState<StudentGrades[]>(grades);
  const toast = useToast();

  if (error || !course || !grades || !user) {
    return <Layout>{error}</Layout>;
  }

  return (
    <CourseLayout course={course} user={user}>
      <Box>
        <Center>
          <Heading mt="30px" mr="25%">
            Grades
          </Heading>
        </Center>
        <SimpleGrid
          mt="5vh"
          spacing="30px"
          templateColumns="repeat(auto-fill, minmax(250px, 1fr))"
        >
          {user.user_type !== UserType.Student ? (
            <CreateGrade
              setCourseGrades={setCourseGrades}
              course_students={course_students}
              user={user}
              course_id={course.id}
              toast={toast}
            />
          ) : null}
          {courseGrades.map((student_grades) => {
            return (
              <StudentGradeBox
                student_grades={student_grades}
                user={user}
                setGrades={setCourseGrades}
                toast={toast}
              />
            );
          })}
        </SimpleGrid>
      </Box>
    </CourseLayout>
  );
}
