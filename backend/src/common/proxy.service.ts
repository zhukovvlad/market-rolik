import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);
  private axiosInstance: AxiosInstance;

  constructor(private configService: ConfigService) {
    this.axiosInstance = this.createAxiosInstance();
  }

  private createAxiosInstance(): AxiosInstance {
    const proxyHost = this.configService.get<string>('PROXY_HOST');
    const proxyPort = this.configService.get<string>('PROXY_PORT');
    const proxyUser = this.configService.get<string>('PROXY_USER');
    const proxyPass = this.configService.get<string>('PROXY_PASSWORD');

    // ИСПРАВЛЕНИЕ: Явно указываем тип any, чтобы TypeScript разрешил переопределение
    let httpsAgent: any = undefined;

    // Если в .env задан прокси — настраиваем агент
    if (proxyHost && proxyPort) {
      const auth = proxyUser && proxyPass ? `${proxyUser}:${proxyPass}@` : '';
      const proxyUrl = `http://${auth}${proxyHost}:${proxyPort}`;

      this.logger.log(`🔌 Initializing Proxy Agent: ${proxyHost}:${proxyPort}`);
      httpsAgent = new HttpsProxyAgent(proxyUrl);
    } else {
      this.logger.log('🌍 Using Direct Connection (No Proxy configured)');
    }

    return axios.create({
      httpsAgent,
      proxy: false, // Отключаем стандартный axios proxy, т.к. используем агент
      timeout: 60000, // 60 секунд таймаут
    });
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
