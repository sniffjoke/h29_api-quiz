import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostCreateModel } from '../../api/models/input/create-post.input.model';
import { BlogsRepositoryTO } from '../../../blogs/infrastructure/blogs.repository.to';
import { PostsRepositoryTO } from '../../infrastructure/posts.repository.to';
import {UsersService} from "../../../users/application/users.service";

export class CreatePostCommand {
  constructor(
    public postCreateModel: PostCreateModel,
    public bearerHeader?: string
  ) {
  }

}

@CommandHandler(CreatePostCommand)
export class CreatePostUseCase
  implements ICommandHandler<CreatePostCommand> {
  constructor(
    private readonly blogsRepository: BlogsRepositoryTO,
    private readonly postsRepository: PostsRepositoryTO,
    private readonly usersService: UsersService
  ) {
  }

  async execute(command: CreatePostCommand) {
    const findedBlog = await this.blogsRepository.findBlogById(command.postCreateModel.blogId);
    if (!command.bearerHeader) {
      return await this.postsRepository.createPost(command.postCreateModel, findedBlog.name);
    }
    const user = await this.usersService.getUserByAuthToken(command.bearerHeader);
    return await this.postsRepository.createPost(command.postCreateModel, findedBlog.name, user);
  }
}
