import Header from "./Header";
import Footer from "./Footer";
import { Box } from "@chakra-ui/react";

export default function Layout({ children }) {
  return (
    <>
      <Header />
      <Box minH="82vh">{children}</Box>
      <Footer />
    </>
  );
}
