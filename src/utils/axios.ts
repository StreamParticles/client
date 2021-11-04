import axios from "axios";
import { stringify } from "querystring";

type QueryObject = {
  [key: string]: string[] | string | number | boolean;
};

const config = (token?: string) => {
  return {
    ...(token && {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
  };
};

export const axiosPost = async (
  endPoint: string,
  body: object | null,
  token?: string
) => {
  try {
    const res = await axios.post(endPoint, body, config(token));

    return res.data;
  } catch (error) {
    throw new Error(error?.response?.data?.message);
  }
};

export const axiosGet = async (
  endPoint: string,
  token: string | null = null,
  query?: QueryObject | string
) => {
  const route = query
    ? `${endPoint}?${typeof query === "string" ? query : stringify(query)}`
    : endPoint;

  try {
    const res = await axios.get(route, config(token));

    return res.data;
  } catch (error) {
    throw new Error(error?.response?.data?.message);
  }
};
