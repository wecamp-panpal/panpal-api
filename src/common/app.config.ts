import { ConfigService } from "@nestjs/config";
import { NestExpressApplication } from "@nestjs/platform-express";

export const getAppConfigs = (app: NestExpressApplication) => {
  const configService = app.get(ConfigService);
  const configs = {
    name: configService.get("API_SERVICE_NAME"),
    port: configService.get("API_SERVICE_PORT"),
    global_prefix: configService.get<string>("API_SERVICE_GLOBAL_PREFIX"),
    node_env: configService.get<string>("NODE_ENV"),
  };
  return configs;
};
