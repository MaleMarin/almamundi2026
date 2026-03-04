export type LiveCamera = {
  id: string;
  title: string;
  place: string;
  country: string;
  lat: number;
  lng: number;
  provider: string;
  embedUrl: string;
  sourceUrl: string;
};

export const LIVE_CAMERAS: LiveCamera[] = [
  {
    id: "times-square",
    title: "Times Square Live",
    place: "New York",
    country: "USA",
    lat: 40.758,
    lng: -73.9855,
    provider: "YouTube",
    embedUrl: "https://www.youtube.com/embed/1-iS7LArMPA",
    sourceUrl: "https://www.youtube.com/watch?v=1-iS7LArMPA"
  },
  {
    id: "tokyo-crossing",
    title: "Shibuya Crossing",
    place: "Tokyo",
    country: "Japan",
    lat: 35.6595,
    lng: 139.7005,
    provider: "YouTube",
    embedUrl: "https://www.youtube.com/watch?v=p5qjv3qU6oY",
    sourceUrl: "https://www.youtube.com/watch?v=p5qjv3qU6oY"
  }
];
