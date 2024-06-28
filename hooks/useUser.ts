import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function useUser() {
  const { data, error, isLoading } = useSWR("/api/user", fetcher);

  return {
    user: data?.user,
    isLoading,
    error,
  };
}

export default useUser;
