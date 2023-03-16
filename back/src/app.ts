// //import "reflect-metadata";
// import {Request, Response} from "express";
// import * as morgan from "morgan";
// import * as pkg from "../package.json";
// import * as express from "express";
// import authRoutes from "./routes/auth.routes";
// import liquidaRoutes from "./routes/liquida.routes";
// import usersRoutes from "./routes/users.routes";
// import infoRoutes from "./routes/info.routes";

// const app = express();

// app.use(morgan('dev'));
// app.use(express.json());

// app.set('pkg', pkg);
    
// app.get("/", ( req, res )=> {
//     res.json({            
//         author: app.get('pkg').author,
//         name: app.get('pkg').name,
//         description: app.get('pkg').description,
//         version: app.get('pkg').version,
//     });
// })

// app.use("/api/auth",authRoutes);
// app.use("/api/liquida",liquidaRoutes);
// app.use("/api/usuarios",usersRoutes);
// app.use("/api/info",infoRoutes);


// export default app;
