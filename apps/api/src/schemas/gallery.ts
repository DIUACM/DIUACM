import { z } from "zod";

import { pageFields } from "../lib/pagination";

export const galleryListQuery = z.object({ ...pageFields });
