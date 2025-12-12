import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { URL } from 'node:url';

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);
  private axiosInstance: AxiosInstance;
  private httpsAgent?: HttpsProxyAgent<string>;
  private httpsAgentInitialized = false;

  constructor(private configService: ConfigService) {
    this.axiosInstance = this.createAxiosInstance();
  }

  private createAxiosInstance(): AxiosInstance {
    const httpsAgent = this.getHttpsAgent();

    return axios.create({
      httpsAgent,
      proxy: false, // Отключаем стандартный axios proxy, т.к. используем агент
      timeout: 60000, // 60 секунд таймаут
    });
  }

  private buildProxyUrl(): string | undefined {
    const proxyHost = this.configService.get<string>('PROXY_HOST');
    const proxyPort = this.configService.get<string>('PROXY_PORT');
    const proxyUser = this.configService.get<string>('PROXY_USER');
    const proxyPass = this.configService.get<string>('PROXY_PASSWORD');

    if (!proxyHost || !proxyPort) return undefined;

    const url = new URL(`http://${proxyHost}:${proxyPort}`);
    // URL will percent-encode credentials safely when stringified
    if (proxyUser) url.username = proxyUser;
    if (proxyPass) url.password = proxyPass;
    return url.toString();
  }

  /**
   * Get HTTPS proxy agent for use in external libraries (e.g., passport-google-oauth20)
   * Returns undefined if no proxy is configured
   */
  getHttpsAgent(): HttpsProxyAgent<string> | undefined {
    const proxyUrl = this.buildProxyUrl();
    if (!proxyUrl) {
      if (!this.httpsAgentInitialized) {
        this.logger.log('🌍 Using Direct Connection (No Proxy configured)');
        this.httpsAgentInitialized = true;
      }
      return undefined;
    }

    if (!this.httpsAgent) {
      this.logger.log(`🔌 Initializing Proxy Agent: ${proxyUrl}`);
      this.httpsAgent = new HttpsProxyAgent(proxyUrl);
      this.httpsAgentInitialized = true;
    }

    return this.httpsAgent;
  }

  // Метод-обертка для POST запросов (например, в Kling)
  async post<T>(
    url: string,
    data: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    try {
      const response = await this.axiosInstance.post<T>(url, data, config);
      return response.data;
    } catch (error) {
      this.handleError(error, url);
      throw error;
    }
  }

  // Метод-обертка для GET запросов
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.axiosInstance.get<T>(url, config);
      return response.data;
    } catch (error) {
      this.handleError(error, url);
      throw error;
    }
  }

  private handleError(error: any, url: string) {
    if (axios.isAxiosError(error)) {
      this.logger.error(
        `❌ Request failed to ${url}: ${error.message}`,
        error.response?.data,
      );
    } else {
      this.logger.error(`❌ Unexpected error: ${error}`);
    }
  }
}
