import { Box } from "@chakra-ui/react";
import { Dispatch, SetStateAction } from "react";
import { useDrop } from "react-dnd";
import { Tag } from "../../../pages/announcements/create";
import DisplayTagCreate from "./DisplayTagCreate";

type Props = {
  tags: Tag[];
  setTagList: Dispatch<SetStateAction<Tag[]>>;
  setIndex: Dispatch<SetStateAction<number>>;
  displaySelected: boolean;
};

export default function DisplayColumnCreate({
  tags,
  setTagList,
  setIndex,
  displaySelected,
}: Props) {
  const [_, drop] = useDrop({
    accept: "tag",
    drop: (item: Tag) => {
      if (item.selected === displaySelected) {
        return;
      }
      // find the index of the tag that was dragged
      const index = tags.findIndex((tag) => tag.id == item.id);
      setIndex(index);
    },
  });

  return (
    <Box ref={drop} height="100%">
      {tags
        .filter((tag) => tag.selected === displaySelected)
        .map((tag) => (
          <DisplayTagCreate tag={tag} />
        ))}
    </Box>
  );
}
