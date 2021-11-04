import { TransactionData } from "@streamparticles/lib";
import io, { Socket } from "socket.io-client";

import { axiosGet } from "./utils/axios";

const HOST = "http://localhost:4000";

const BASE_ENDPOINTS = {
  LAST_DONATORS: `${HOST}/v1/analytics/last-donators/`,
  TOP_DONATORS: `${HOST}/v1/analytics/top-donators/`,
  DONATIONS_RECAP: `${HOST}/v1/analytics/donations-recap/`,
  SOCKET_GATEWAY: `${HOST}`,
};

class StreamParticlesClient {
  private herotag: string;
  private apiKey: string;
  public socket: Socket;
  private isSocketAuthenticated: boolean = false;
  private endpoints: { [key: string]: string } = {};

  constructor(
    herotag: string,
    apiKey: string,
    { withSocket = true } = { withSocket: true }
  ) {
    if (!herotag) throw new Error("Missing herotag");
    if (!apiKey) throw new Error("Missing apiKey");

    this.herotag = herotag;
    this.apiKey = apiKey;

    this.endpoints = {
      LAST_DONATORS: `${BASE_ENDPOINTS.LAST_DONATORS}/api-key/${apiKey}`,
      TOP_DONATORS: `${BASE_ENDPOINTS.TOP_DONATORS}/api-key/${apiKey}`,
      DONATIONS_RECAP: `${BASE_ENDPOINTS.DONATIONS_RECAP}/api-key/${apiKey}`,
      SOCKET_GATEWAY: BASE_ENDPOINTS.SOCKET_GATEWAY,
    };

    if (withSocket) {
      this.socket = io(this.endpoints.SOCKET_GATEWAY);

      this.socket.on("disconnect", () => {
        this.isSocketAuthenticated = false;
      });
    }
  }

  public getLastDonators = () => {
    return axiosGet(this.endpoints.LAST_DONATORS);
  };

  public getTopDonators = () => {
    return axiosGet(this.endpoints.TOP_DONATORS);
  };

  public getDonationsRecap = () => {
    return axiosGet(this.endpoints.DONATIONS_RECAP);
  };

  public connectSocket() {
    if (!this.socket) {
      throw new Error("You must enable socket client in class construction");
    }

    // Server tell us that we are connect via socket
    this.socket.on("connect", () => {
      console.log("test hello");
      // We emit an authentication socket with the authToken
      // We send the herotag too in order to join the good socket room
      this.socket.emit("authentication", {
        apiKey: this.apiKey,
        herotag: this.herotag,
      });

      // Server responds that we are well authenticated
      this.socket.on("authenticated", function () {
        this.isSocketAuthenticated = true;
      });
    });
  }

  public onDonation(react: (data: TransactionData) => void) {
    if (!this.isSocketAuthenticated) {
      throw new Error("You are not authenticated to the socket yet");
    }

    this.socket.on("donation", react);
  }

  public disconnectSocket() {
    if (!this.socket) {
      throw new Error("You must enable socket client in class construction");
    }

    this.socket.disconnect();
  }
}

export { TransactionData };
export default StreamParticlesClient;
