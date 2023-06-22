import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as pactum from 'pactum';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuthDto } from 'src/auth/dto';
import { EditUserDto } from 'src/user/dto';
import { CreateBookmarkDto, EditBookmarkDto } from 'src/bookmark/dto';

describe('App e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({whitelist: true}));
    await app.init();
    await app.listen(3333);

    prisma = app.get(PrismaService);
    await prisma.cleanDb();
    pactum.request.setBaseUrl('http://localhost:3333');
  })

  afterAll(() => {
    app.close();
  });

  describe('Auth', () => {
    const dto: AuthDto = {
      email: 'darwin@gmail.com',
      password: '123'
    }
    describe('Signup', () => {
      it('Should throw error if email is empty', () => {
        return pactum
        .spec()
        .post('/auth/signup')
        .withBody({ password: dto.password })
        .expectStatus(400);
      });
      it('Should throw error if password is empty', () => {
        return pactum
        .spec()
        .post('/auth/signup')
        .withBody({ email: dto.email })
        .expectStatus(400);
      });
      it('Should throw error if no details provided', () => {
        return pactum
        .spec()
        .post('/auth/signup')
        .expectStatus(400);
      });
      it('Should signed up', () => {
        return pactum
        .spec()
        .post('/auth/signup')
        .withBody(dto)
        .expectStatus(201);
      });
    });

    describe('Signin', () => {
      it('Should throw error if email is empty', () => {
        return pactum
        .spec()
        .post('/auth/signin')
        .withBody({ password: dto.password })
        .expectStatus(400);
      });
      it('Should throw error if password is empty', () => {
        return pactum
        .spec()
        .post('/auth/signin')
        .withBody({ email: dto.email })
        .expectStatus(400);
      });
      it('Should throw error if no details provided', () => {
        return pactum
        .spec()
        .post('/auth/signin')
        .expectStatus(400);
      });
      it('Should signed in', () => {
        return pactum
        .spec()
        .post('/auth/signin')
        .withBody(dto)
        .expectStatus(200)
        .stores('userAt', 'access_token');
      });
    });
  });

  describe('User', () => {
    describe('Get me', () => {
      it('Should get current user', () => {
        return pactum
        .spec()
        .get('/users/me')
        .withHeaders({ Authorization: 'Bearer $S{userAt}' })
        .expectStatus(200);
      })
    });

    describe('Edit user', () => {
      it('Should edit user', () => {
        const dto: EditUserDto = {
          firstName: 'Darwin John',
          lastName: 'Cruz'
        }
        return pactum
        .spec()
        .patch('/users')
        .withHeaders({ Authorization: 'Bearer $S{userAt} '})
        .withBody(dto)
        .expectStatus(200)
        .expectBodyContains(dto.firstName)
        .expectBodyContains(dto.lastName);
      })
    });
  })

  describe('Bookmark', () => {
    describe('Get empty bookmarks', () => {
      it('Should get empty bookmarks', () => {
        return pactum
        .spec()
        .get('/bookmarks')
        .withHeaders({ Authorization: 'Bearer $S{userAt}' })
        .expectStatus(200)
        .expectBody([]);
      });
    });

    describe('Create bookmark', () => {
      const dto: CreateBookmarkDto = {
        title: 'First Bookmark',
        link: 'First link'
      }
      it('Should create bookmark', () => {
        return pactum
        .spec()
        .post('/bookmarks')
        .withHeaders({ Authorization: 'Bearer $S{userAt}' })
        .withBody(dto)
        .expectStatus(201)
        .stores('bookmarkId', 'id');
      });
    });

    describe('Get bookmarks', () => {
      it('Should get bookmarks', () => {
        return pactum
        .spec()
        .get('/bookmarks')
        .withHeaders({ Authorization: 'Bearer $S{userAt}' })
        .expectStatus(200)
        .expectJsonLength(1);
      });
    });

    describe('Get bookmark by id', () => {
      it('Should get bookmark by id', () => {
        return pactum
        .spec()
        .get('/bookmarks/{id}')
        .withPathParams('id', '$S{bookmarkId}')
        .withHeaders({ Authorization: 'Bearer $S{userAt}' })
        .expectStatus(200)
        .expectBodyContains('$S{bookmarkId}');
      });
    });

    describe('Edit bookmark by id', () => {
      const dto: EditBookmarkDto = {
        title: 'First Title',
        description: 'First Description'
      }
      it('Should edit bookmark', () => {
        return pactum
        .spec()
        .patch('/bookmarks/{id}')
        .withPathParams('id', '$S{bookmarkId}')
        .withHeaders({ Authorization: 'Bearer $S{userAt}' })
        .withBody(dto)
        .expectStatus(200)
        .expectBodyContains(dto.title)
        .expectBodyContains(dto.description);
      });
    });

    describe('Delete bookmark by id', () => {
      it('Should delete bookmark', () => {
        return pactum
        .spec()
        .delete('/bookmarks/{id}')
        .withPathParams('id', '$S{bookmarkId}')
        .withHeaders({ Authorization: 'Bearer $S{userAt}' })
        .expectStatus(204);
      });

      it('Should get empty bookmarks', () => {
        return pactum
        .spec()
        .get('/bookmarks')
        .withHeaders({ Authorization: 'Bearer $S{userAt}' })
        .expectStatus(200)
        .expectBody([]);
      });
    });
  });
});