// Type declarations for JavaScript route modules
import type { Router } from 'express';

declare module './routes/notes.js' {
  const router: Router;
  export default router;
}

declare module './routes/tags.js' {
  const router: Router;
  export default router;
}

declare module './routes/auth.js' {
  const router: Router;
  export default router;
}

declare module './routes/tasks.js' {
  const router: Router;
  export default router;
}



