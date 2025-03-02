import {Module} from "@nestjs/common";
import {BlogsController} from "./api/blogs.controller";
import {PostsModule} from "../posts/posts.module";
import {BlogsCommandHandlers} from './application/useCases';
import {BlogsRepositoryTO} from './infrastructure/blogs.repository.to';
import {TypeOrmModule} from '@nestjs/typeorm';
import {BlogEntity} from './domain/blogs.entity';
import {PostEntity} from '../posts/domain/posts.entity';
import {BlogsQueryRepositoryTO} from './infrastructure/blogs.query-repository.to';
import {BloggersController} from "./api/bloggers.controller";
import {BlogsSAController} from "./api/blogs.sa.controller";
import {UsersModule} from "../users/users.module";
import {UsersCheckHandler} from "../users/domain/users.check-handler";

@Module({
    imports: [
        TypeOrmModule.forFeature([BlogEntity, PostEntity]),
        PostsModule,
        UsersModule,
    ],
    controllers: [
        BlogsController,
        BlogsSAController,
        BloggersController
    ],
    providers: [
        BlogsQueryRepositoryTO,
        BlogsRepositoryTO,
        ...BlogsCommandHandlers,
        UsersCheckHandler
    ],
    exports: [
        BlogsQueryRepositoryTO,
        BlogsRepositoryTO,
        ...BlogsCommandHandlers
    ]
})
export class BlogsModule {
}
