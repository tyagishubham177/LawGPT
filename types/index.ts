export enum OpenAIModel {
  DAVINCI_TURBO = "gpt-3.5-turbo"
}

export enum ResourceType{
    BOOK = "RT_BOOK",
}

export type PGResource = {
  resource_title: string;
  resource_type: ResourceType;
  resource_upload_date: string;
  content: string;
  content_length: number;
  content_tokens: number;
  embedding: number[];
};

// export type PGJSON = {
//   upload_date: Date;
//   length: number;
//   tokens: number;
//   essays: PGResource[];
// };