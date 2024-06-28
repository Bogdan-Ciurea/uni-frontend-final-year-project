import {
  Link as ChakraLink,
  Text,
  Code,
  List,
  ListIcon,
  ListItem,
} from "@chakra-ui/react";
import { CheckCircleIcon, LinkIcon } from "@chakra-ui/icons";

import { Hero } from "../components/Hero";
import { Container } from "../components/Container";
import { Main } from "../components/Main";
import Layout from "../components/Layout";

const Index = () => (
  <Layout>
    <Container height="84vh">
      <Hero title="School Engine" />
      <Main>
        <Text color="text">
          Welcome to <Code>school-engine</Code>
        </Text>
        <Text color="text">
          Final year project for the University of Leeds. This project is being
          developed by <Code>Bogdan Ciurea (sc20bac)</Code>.
        </Text>
      </Main>
    </Container>
  </Layout>
);

export default Index;
