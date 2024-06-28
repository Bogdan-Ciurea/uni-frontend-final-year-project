import {
  Alert,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  Center,
  Flex,
  Text,
  Heading,
  Link,
  Spacer,
} from "@chakra-ui/react";
import { withIronSessionSsr } from "iron-session/next";
import { GetServerSideProps } from "next";
import React, { useEffect, useState } from "react";
import DisplayAnn from "../../components/announcements/DisplayAnnouncement";
import Layout from "../../components/Layout";
import useUser from "../../hooks/useUser";
import { iron_api_options } from "../../lib/session";

export type Answer = {
  id: string;
  content: string;
  created_at: number;
  created_by_user_name: string;
  created_by_user_id: string;
};

export type MyFile = {
  id: string;
  created_by: string;
  name: string;
  path: string;
};

export type Announcement = {
  id: string;
  answers: Answer[];
  content: string;
  created_at: number;
  files: MyFile[];
  title: string;
  created_by_user_id: string;
  created_by_user_name: string;
  allow_answers: boolean;
};

export const enum UserType {
  Admin = 0,
  Teacher = 1,
  Student = 2,
}

export type User = {
  token: string;
  last_time_online: number;
  changed_password: boolean;
  phone_number: string;
  email: string;
  user_id: string;
  user_type: UserType;
  first_name: string;
  last_name: string;
};

type Props = {
  announcements: Announcement[];
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

  const response = await fetch(
    process.env.BACKEND_URL + "/api/user_announcements",
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
        announcements: null,
        error: (
          (await response.json()) as {
            error: string;
          }
        ).error,
      },
    };
  }

  const announcements = (await response.json()) as Announcement[];
  // order the answers inside the announcements
  if (!announcements) return { props: { announcements: [], error: null } };
  announcements.forEach((ann) => {
    ann.answers.sort((a, b) => b.created_at - a.created_at);
  });

  return {
    props: {
      // Return the announcements ordered by date
      announcements: announcements.sort((a, b) => b.created_at - a.created_at),
      error: null,
    },
  };
};

export const getServerSideProps = withIronSessionSsr(ssp, iron_api_options);

// This is the React component that will be rendered on the page
function AnnouncementsPage({ error, announcements }: Props) {
  const { user } = useUser();
  const [announcements_list, setAnnouncements] = useState(announcements);
  const [changedIndex, setChangedIndex] = useState<number>(null);

  useEffect(() => {
    // console.log("Deleting: " + changedIndex);
    // console.log("List was changed");
  }, [announcements_list]);

  if (!user || error) {
    return (
      <Layout>
        <Center>
          <Text fontSize="xl">{error}</Text>
        </Center>
      </Layout>
    );
  }

  return (
    <Layout>
      {error ? (
        <Alert status="error">
          <AlertIcon />
          <AlertTitle>{error}</AlertTitle>
        </Alert>
      ) : (
        <>
          <Center m="20px">
            <Heading>Announcements</Heading>
          </Center>
          {user.user_type !== UserType.Student ? (
            <Flex ml="10vw" w="80vw">
              <Spacer />
              <Link href="/announcements/create">
                <Button size="lg" variant="outline" colorScheme="green">
                  Create Announcement
                </Button>
              </Link>
            </Flex>
          ) : null}

          <Box ml="10vw" w="80vw">
            {announcements_list.map((ann, index) => (
              <DisplayAnn
                ann={ann}
                index={index}
                user={user}
                setChangedIndex={setChangedIndex}
                setAnnouncements={setAnnouncements}
              />
            ))}
          </Box>
        </>
      )}
    </Layout>
  );
}

export default AnnouncementsPage;
