import {Injectable, NotFoundException} from '@nestjs/common';
import {BlogViewModel} from '../api/models/output/blog.view.model';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {PaginationBaseModel} from '../../../core/base/pagination.base.model';
import {BlogEntity} from '../domain/blogs.entity';
import {UserEntity} from "../../users/domain/user.entity";


@Injectable()
export class BlogsQueryRepositoryTO {
    constructor(
        @InjectRepository(BlogEntity) private readonly bRepository: Repository<BlogEntity>
    ) {
    }

    async getAllBlogsWithQuery(query: any, getUsers?: boolean, userId?: string) {
        const generateQuery = await this.generateQuery(query, getUsers, userId);
        const items = this.bRepository
            .createQueryBuilder('b')
            .where('LOWER(b.name) LIKE LOWER(:name)', {name: generateQuery.searchNameTerm.toLowerCase()})
            .orderBy(`b."${generateQuery.sortBy}"`, generateQuery.sortDirection.toUpperCase())
            .offset((generateQuery.page - 1) * generateQuery.pageSize)
            .limit(generateQuery.pageSize)
        if (getUsers) {
            items.leftJoinAndSelect('b.user', 'user')
        }
        if (userId) {
            items.andWhere('b.userId = :id', { id: userId })
        }
        const itemsWithQuery = await items.getMany()
        const itemsOutput = itemsWithQuery.map(item => this.blogOutputMap(item, item.user));
        const resultBlogs = new PaginationBaseModel<BlogViewModel>(generateQuery, itemsOutput);
        return resultBlogs;
    }

    private async generateQuery(query: any, getUsers?: boolean, userId?: string) {
        const searchNameTerm: string = query.searchNameTerm ? query.searchNameTerm : '';
        const totalCount = this.bRepository
            .createQueryBuilder('b')
            .where('LOWER(b.name) LIKE LOWER(:name)', {name: `%${searchNameTerm.toLowerCase()}%`})
        if (getUsers) {
            totalCount.leftJoinAndSelect('b.user', 'user')
        }
        if (userId) {
            totalCount.andWhere('b.userId = :id', { id: userId })
        }
        const totalCountWithQuery = await totalCount.getCount()
        const pageSize = query.pageSize ? +query.pageSize : 10;
        const pagesCount = Math.ceil(totalCountWithQuery / pageSize);

        return {
            totalCount: totalCountWithQuery,
            pageSize,
            pagesCount,
            page: query.pageNumber ? Number(query.pageNumber) : 1,
            sortBy: query.sortBy ? query.sortBy : 'createdAt',
            sortDirection: query.sortDirection ? query.sortDirection : 'desc',
            searchNameTerm: '%' + searchNameTerm + '%',
        };
    }

    async blogOutput(id: string, user?: UserEntity) {
        const findedBlog = await this.bRepository.findOne({
            where: {id},
        })
        if (!findedBlog) {
            throw new NotFoundException(`Blog with id ${id} not found`);
        }
        if (user) return this.blogOutputMap(findedBlog, user)
        return this.blogOutputMap(findedBlog);
    }

    blogOutputMap(blog: BlogViewModel, user?: UserEntity) {
        const {id, name, description, websiteUrl, isMembership, createdAt} = blog;
        const output: typeof blog = {
            id: id.toString(),
            name,
            description,
            websiteUrl,
            createdAt,
            isMembership,
        };

        if (user) {
            output.blogOwnerInfo = {
                userId: user.id.toString(),
                userLogin: user.login,
            };
        }

        return output;
    }

}
