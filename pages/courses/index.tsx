// Display hello to courses

import {
  Card,
  CardBody,
  Center,
  Heading,
  Text,
  Image,
  Stack,
  Divider,
  CardFooter,
  Button,
  SimpleGrid,
  Link,
  AlertTitle,
  AlertIcon,
  Alert,
  Spacer,
  HStack,
  useToast,
} from "@chakra-ui/react";
import { withIronSessionSsr } from "iron-session/next";
import { GetServerSideProps } from "next";
import React, { useState } from "react";
import Layout from "../../components/Layout";
import { iron_api_options, UserType } from "../../lib/session";
import { DeleteIcon } from "@chakra-ui/icons";

export type Course = {
  start_date: number;
  end_date: number;
  id: string;
  name: string;
  created_at: string;
  course_thumbnail: string;
};

type User = {
  token: string;
  last_time_online: number;
  changed_password: boolean;
  phone_number: string;
  email: string;
  user_id: string;
  user_type: number;
  first_name: string;
  last_name: string;
};

type Props = {
  courses: Course[];
  user: User;
  user_token: string;
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

  const response = await fetch(process.env.BACKEND_URL + "/api/user_courses", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + req.session.user.token,
    },
  });

  if (response.status !== 200) {
    return {
      props: {
        error: (
          (await response.json()) as {
            error: string;
          }
        ).error,
        courses: null,
        user_token: null,
        user: null,
      },
    };
  }

  const courses = (await response.json()) as Course[];

  return {
    props: {
      courses,
      user_token: req.session.user.token,
      error: null,
      user: req.session.user,
    },
  };
};

export const getServerSideProps = withIronSessionSsr(ssp, iron_api_options);

function CourseCard({
  course,
  user_token,
  setCourseList,
}: {
  course: Course;
  user_token: string;
  setCourseList: React.Dispatch<React.SetStateAction<Course[]>>;
}) {
  const date = new Date(course.start_date * 1000);
  const string_date = date.toLocaleDateString("en-UK", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const deleteCourse = async () => {
    const response = await fetch("http://localhost:3000/api/course", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        course_id: course.id,
      }),
    });

    if (response.status !== 200) {
      console.log("Error");
      return;
    }

    setCourseList((prev) => prev.filter((c) => c.id !== course.id));
  };

  const formatted_image_url =
    "http://127.0.0.1:8080/api/course/" +
    course.id +
    "/thumbnail?user_token=" +
    user_token;

  return (
    <Center key={course.id}>
      <Card maxW="sm">
        <CardBody>
          <Center>
            <Image
              src={
                course.course_thumbnail === ""
                  ? "https://via.placeholder.com/250"
                  : formatted_image_url
              }
              alt="The course does not have a thumbnail"
              w="250px"
              h="250px"
              borderRadius="lg"
            />
          </Center>
          <Stack mt="6" spacing="3">
            <Heading size="md">{course.name}</Heading>
            <Text color="blue.600" fontSize="small">
              Starting date: {string_date}
            </Text>
          </Stack>
        </CardBody>
        <Divider />
        <CardFooter>
          <HStack>
            <Link href={`/courses/${course.id}/files`}>
              <Button variant="ghost" colorScheme="blue">
                View course
              </Button>
            </Link>
            <Spacer />
            <Button
              variant="ghost"
              onClick={() => {
                deleteCourse();
              }}
            >
              <DeleteIcon />
            </Button>
          </HStack>
        </CardFooter>
      </Card>
    </Center>
  );
}

function DisplayCourses({ courses, user, error, user_token }: Props) {
  if (error) {
    const toast = useToast();
    toast({
      title: "Error",
      description: error,
      status: "error",
      duration: 9000,
      isClosable: true,
    });

    return (
      <Layout>
        <></>
      </Layout>
    );
  }

  const [courseList, setCourseList] = useState<Course[]>(courses);

  return (
    <Layout>
      <Center mt="3vh" mb="3vh" fontSize={32}>
        Courses
      </Center>
      {user.user_type === UserType.Admin ||
      user.user_type === UserType.Teacher ? (
        <Center mb="3vh">
          <Link href="/courses/create">
            <Button colorScheme="teal" variant="outline">
              Create Course
            </Button>
          </Link>
        </Center>
      ) : (
        <></>
      )}

      {error ? (
        <Alert status="error">
          <AlertIcon />
          <AlertTitle>{error}</AlertTitle>
        </Alert>
      ) : courseList.length === 0 ? (
        <Center mt="3vh" mb="3vh" fontSize={32}>
          You are not enrolled in any course
        </Center>
      ) : (
        <SimpleGrid
          ml="5vw"
          mr="5vw"
          spacing="10px"
          templateColumns="repeat(auto-fill, minmax(275px, 1fr))"
        >
          {courseList.map((c) => {
            return (
              <CourseCard
                course={c}
                user_token={user_token}
                setCourseList={setCourseList}
              />
            );
          })}
        </SimpleGrid>
      )}
    </Layout>
  );
}

export default DisplayCourses;
