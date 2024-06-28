import { Tag } from "../../../pages/announcements/create";
import { Tag as ChakraTag } from "@chakra-ui/react";
import { useDrag } from "react-dnd";

type Props = {
  tag: Tag;
};

export default function DisplayTagCreate({ tag }: Props) {
  const [_, drag] = useDrag({
    type: "tag",
    item: {
      id: tag.id,
      name: tag.name,
      colour: tag.colour,
      selected: tag.selected,
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  return (
    <ChakraTag
      ref={drag}
      m="5px"
      key={tag.id}
      size="lg"
      borderRadius="full"
      colorScheme={tag.colour}
      cursor="pointer"
      _hover={{
        opacity: 0.8,
      }}
    >
      {tag.name}
    </ChakraTag>
  );
}
