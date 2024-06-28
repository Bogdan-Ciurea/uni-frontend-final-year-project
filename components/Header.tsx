import React from "react";
import {
  Box,
  Button,
  ButtonGroup,
  Container,
  Flex,
  HStack,
  IconButton,
  useBreakpointValue,
  Spacer,
  Link,
  Icon,
  MenuButton,
  Menu,
  MenuList,
  MenuItem,
  MenuDivider,
  Avatar,
  Center,
} from "@chakra-ui/react";
import { useColorModeValue } from "@chakra-ui/react";

import { FiMenu } from "react-icons/fi";
import { DarkModeSwitch } from "./DarkModeSwitch";
import useUser from "../hooks/useUser";
import { IoSchool } from "react-icons/io5";
import { NextRouter, useRouter } from "next/router";
import { UserType } from "../lib/session";

function getAvailableLinks(userType: UserType) {
  let links = [
    { name: "Courses", href: "/courses" },
    { name: "Todo", href: "/todo" },
    { name: "Announcements", href: "/announcements" },
  ];

  if (userType === UserType.Student) {
    links.push({ name: "Grades", href: "/grades" });
  }
  if (userType === UserType.Teacher || userType === UserType.Admin) {
    links.push({ name: "Management", href: "/management/users" });
  }

  return links;
}

async function log_out(router: NextRouter) {
  const response = await fetch("http://localhost:3000/api/logout");

  if (response.status !== 200) {
    const error_string = (await response.json()) as { error: string };
    const error = error_string;
    console.log(error);

    alert(error);
  }

  router.reload();

  return null;
}

function Header() {
  const { user, error, isLoading } = useUser();
  const router = useRouter();

  const isDesktop = useBreakpointValue({
    base: false,
    lg: true,
  });

  // for color mode
  const background = useColorModeValue("gray.100", "gray.700");

  return (
    <Box as="section" w="100%" h="8vh">
      <Box as="nav" bg={background} boxShadow="sm">
        <Container py={{ base: "4", lg: "5" }} minW="90%">
          <HStack justify="space-between">
            <Link href="/">
              <Icon as={IoSchool} w={6} h={6} mr="1vh" />
            </Link>

            {isDesktop ? (
              <Flex justify="space-between" flex="2">
                {user ? (
                  <ButtonGroup variant="link" spacing="8">
                    {getAvailableLinks(user?.user_type).map((item) => (
                      <Link href={item.href}>
                        <Button key={item.name}>{item.name}</Button>
                      </Link>
                    ))}
                  </ButtonGroup>
                ) : (
                  <h1>You will have to be logged in to access the links</h1>
                )}
                <Spacer />
                {!user || error || isLoading ? (
                  <HStack spacing="3">
                    <Link href="/login">
                      <Button colorScheme="teal" variant="outline">
                        Sign in
                      </Button>
                    </Link>
                  </HStack>
                ) : (
                  <Menu>
                    <MenuButton
                      as={Button}
                      rounded={"full"}
                      variant={"link"}
                      cursor={"pointer"}
                      minW={0}
                    >
                      <Avatar
                        size={"sm"}
                        name={user.first_name + " " + user.last_name}
                      />
                    </MenuButton>
                    <MenuList alignItems={"center"}>
                      <br />
                      <Center>
                        <Avatar
                          size={"2xl"}
                          name={user.first_name + " " + user.last_name}
                        />
                      </Center>
                      <br />
                      <Center>
                        <p>{user.first_name + " " + user.last_name}</p>
                      </Center>
                      <br />
                      <MenuDivider />
                      <MenuItem>
                        <Link href="/dashboard">Your Dashboard</Link>
                      </MenuItem>
                      <MenuItem>
                        <Link onClick={() => log_out(router)}>Logout</Link>
                      </MenuItem>
                    </MenuList>
                  </Menu>
                )}
              </Flex>
            ) : (
              <IconButton
                variant="ghost"
                icon={<FiMenu fontSize="1.25rem" />}
                aria-label="Open Menu"
              />
            )}
            <DarkModeSwitch />
          </HStack>
        </Container>
      </Box>
    </Box>
  );
}

export default Header;
