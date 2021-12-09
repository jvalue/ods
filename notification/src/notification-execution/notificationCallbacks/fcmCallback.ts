export default interface FcmCallback {
  notification: {
    title: string;
    body: string;
  };
  data?: { [key: string]: string };
  topic: string;
}
