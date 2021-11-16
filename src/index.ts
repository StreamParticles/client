import { TransactionData } from "@streamparticles/lib";
import io, { Socket } from "socket.io-client";

import { axiosGet } from "./utils/axios";

const HOST = "https://streamparticles.io";

class StreamParticlesClient {
  private herotag: string;
  private apiKey: string;
  public socket?: Socket;
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
      LAST_DONATORS: `${HOST}/v1/:apiKey/last-donators/`,
      TOP_DONATORS: `${HOST}/v1/:apiKey/top-donators/`,
      DONATIONS_RECAP: `${HOST}/v1/:apiKey/donations-recap/`,
      SOCKET_GATEWAY: `${HOST}`,
    };

    if (withSocket) {
      this.socket = io(this.endpoints.SOCKET_GATEWAY, { autoConnect: false });

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

    return new Promise<void>((resolve) => {
      this.socket.on("connect", () => {
        // We emit an authentication socket with the authToken
        // We send the herotag too in order to join the good socket room
        this.socket.emit("authentication", {
          apiKey: this.apiKey,
          herotag: this.herotag,
        });

        // Server responds that we are well authenticated
        this.socket.on("authenticated", () => {
          this.isSocketAuthenticated = true;
          resolve();
        });
      });

      this.socket.connect();
    });
  }

  public onDonationSocket(react: (data: TransactionData) => void) {
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
