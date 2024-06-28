import {
  Text,
  Center,
  Box,
  useColorModeValue,
  SimpleGrid,
} from "@chakra-ui/react";

function Footer() {
  const background = useColorModeValue("gray.100", "gray.700");

  return (
    <SimpleGrid bg={background} as="footer" w="100%" h="8vh">
      <Box>
        <Center>
          <Text>© Bogdan Ciurea 2023</Text>
        </Center>
      </Box>
      <Box>
        <Center>
          <Text>Final year project for the University of Leeds</Text>
        </Center>
      </Box>
    </SimpleGrid>
  );
}

export default Footer;
