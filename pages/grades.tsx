import { withIronSessionSsr } from "iron-session/next";
import { GetServerSideProps } from "next";
import Layout from "../components/Layout";
import { iron_api_options } from "../lib/session";
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Center,
  Heading,
  SimpleGrid,
  Text,
} from "@chakra-ui/react";

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

type Course = {
  id: string;
  name: string;
  course_thumbnail: string;
  grades: Grade[];
};

type Props = {
  course_list: Course[];
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

  const response = await fetch(process.env.BACKEND_URL + "/api/grades", {
    method: "GET",
    headers: {
      Authorization: "Bearer " + req.session.user.token,
    },
  });

  if (response.status !== 200) {
    return {
      props: {
        course_list: null,
        error: (await response.json()).error,
      },
    };
  }

  return {
    props: {
      course_list: (await response.json()) as Course[],
      error: null,
    },
  };
};

export const getServerSideProps = withIronSessionSsr(ssp, iron_api_options);

function GradeBox({ grade }: { grade: Grade }) {
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
    </Box>
  );
}

function CourseGradeBox({ course }: { course: Course }) {
  let final_grade = 0;
  let total_weight = 0;
  let out_of_max = 0;

  course.grades.forEach((grade) => {
    if (grade.weight !== -1.0) {
      final_grade += grade.grade * grade.weight;
      total_weight += grade.weight;
    }
    out_of_max += grade.out_of;
  });

  course.grades.forEach((grade) => {
    if (grade.weight === 0.0) {
      final_grade += grade.grade * (1 - total_weight);
    }
  });

  return (
    <Box>
      <Center>
        <Text mt="20px" fontSize="2xl">
          {course.name}
        </Text>
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
            {course.grades.map((grade) => {
              return <GradeBox grade={grade} />;
            })}
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </Box>
  );
}

function Grades({ error, course_list }: Props) {
  if (error) {
    return (
      <Layout>
        <Center>
          <Text color="red">error</Text>
        </Center>
      </Layout>
    );
  }

  return (
    <Layout>
      <Center mt="20px">
        <Heading>
          <Text>Grades</Text>
        </Heading>
      </Center>

      <SimpleGrid
        mt="5vh"
        spacing="30px"
        templateColumns="repeat(auto-fill, minmax(250px, 1fr))"
        w="80%"
        ml="10%"
      >
        {course_list.map((course) => {
          return <CourseGradeBox course={course} />;
        })}
      </SimpleGrid>
    </Layout>
  );
}

export default Grades;
