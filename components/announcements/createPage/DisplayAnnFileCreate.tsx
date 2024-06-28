import { DeleteIcon } from "@chakra-ui/icons";
import { Box, Button, Card, Flex, Icon, Text } from "@chakra-ui/react";
import { Dispatch, SetStateAction } from "react";
import { FaFileAlt } from "react-icons/fa";
import { MyFile } from "../../../pages/announcements/create";

type Props = {
  file: MyFile;
  index: number;
  setFiles: Dispatch<SetStateAction<MyFile[]>>;
};

export default function DisplayAnnFileCreate({ file, index, setFiles }: Props) {
  return (
    <Card mt="20px">
      <Flex>
        <Box w="100%" key="description">
          <Flex mt="8px">
            <Icon key="desc_icon" as={FaFileAlt} w={6} h={6} />
            <Text key="desc_title">{file.name}</Text>
          </Flex>
        </Box>
        <Box w="30px" key="spacer"></Box>
        <Button
          colorScheme="red"
          key="delete"
          onClick={() => {
            setFiles((files) => {
              const newFiles = [...files];
              newFiles.splice(index, 1);
              return newFiles;
            });
          }}
        >
          <DeleteIcon />
        </Button>
      </Flex>
    </Card>
  );
}
