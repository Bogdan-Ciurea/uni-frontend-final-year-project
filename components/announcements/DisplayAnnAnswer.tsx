import { DeleteIcon } from "@chakra-ui/icons";
import {
  Avatar,
  Box,
  Button,
  Flex,
  Spacer,
  Tag,
  TagLabel,
  Text,
} from "@chakra-ui/react";
import { Dispatch, SetStateAction } from "react";
import { Answer, User, UserType } from "../../pages/announcements";
import annTheme from "./annTheme";
import { ActionType } from "./DisplayAnnouncement";

type Props = {
  answer: Answer;
  user: User;
  index: number;
  setTempAns: Dispatch<SetStateAction<Answer>>;
  setAnswers: Dispatch<SetStateAction<Answer[]>>;
  setAction: Dispatch<SetStateAction<ActionType>>;
};

export default function DisplayAnnAnswer({
  answer,
  user,
  index,
  setTempAns,
  setAnswers,
  setAction,
}: Props) {
  const date = new Date(answer.created_at * 1000);
  const string_date = date.toLocaleDateString("en-UK", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  });

  return (
    <Box bg={annTheme.semanticTokens.colors.answerBackground} m="20px">
      <Flex>
        <Box>
          <Text>{answer.content}</Text>
        </Box>
        <Spacer />
        <Box>
          <Text>{string_date}</Text>
          {user?.user_type === UserType.Admin ||
          user?.user_id === answer.created_by_user_id ? (
            <Button
              colorScheme="red"
              onClick={() => {
                setAction(ActionType.DeleteAnswer);
                setTempAns(answer);
                setAnswers((ans) => {
                  const new_ans = ans.slice();
                  new_ans.splice(index, 1);
                  return new_ans;
                });
              }}
            >
              <DeleteIcon />
            </Button>
          ) : (
            <></>
          )}
        </Box>
      </Flex>
      <Tag colorScheme="red" borderRadius="full" mr="calc(100% - 200px)">
        <Avatar size="xs" name={answer.created_by_user_name} ml={-1} mr={2} />
        <TagLabel>{answer.created_by_user_name}</TagLabel>
      </Tag>
    </Box>
  );
}
