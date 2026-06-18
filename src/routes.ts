import { FastifyInstance } from 'fastify';
import { db } from './db';
import { 
  companies, estates, afdelings, bloks, baris, hamaPenyakit, 
  pokok, inspeksi, inspeksiDetail, fotoBukti, users
} from './db/schema';
import { eq, inArray } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { verifyAuth } from './middleware/auth';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-ews-rnd-key-2024';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});
export const setupRoutes = async (server: FastifyInstance) => {

  // ==========================================
  // AUTHENTICATION ENDPOINTS (NO AUTH REQUIRED)
  // ==========================================
  server.post('/login', async (request, reply) => {
    const { email, password } = request.body as any;
    server.log.info(`[LOGIN ATTEMPT] email: "${email}"`);
    if (!email || !password) {
      return reply.status(400).send({ success: false, error: 'Email and password are required' });
    }

    try {
      const userList = await db.select().from(users).where(eq(users.email, email.trim()));
      if (userList.length === 0) {
        server.log.warn(`[LOGIN FAILED] user not found for email: "${email}"`);
        return reply.status(401).send({ success: false, error: 'Invalid credentials (user not found)' });
      }

      const user = userList[0];
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        server.log.warn(`[LOGIN FAILED] password mismatch for email: "${email}"`);
        return reply.status(401).send({ success: false, error: 'Invalid credentials (password mismatch)' });
      }

      if (!user.isActive) {
        server.log.warn(`[LOGIN FAILED] user is inactive: "${email}"`);
        return reply.status(403).send({ success: false, error: 'Account is deactivated' });
      }

      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
      
      return reply.send({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            nama: user.nama,
            role: user.role
          }
        }
      });
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({ success: false, error: 'Internal Server Error' });
    }
  });

  server.post('/register', async (request, reply) => {
    const { email, password, nama, role } = request.body as any;
    if (!email || !password || !nama || !role) {
      return reply.status(400).send({ success: false, error: 'Missing required fields' });
    }

    try {
      const existingUser = await db.select().from(users).where(eq(users.email, email));
      if (existingUser.length > 0) {
        return reply.status(400).send({ success: false, error: 'Email already registered' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const [newUser] = await db.insert(users).values({
        email,
        passwordHash,
        nama,
        role,
        isActive: true
      }).returning();

      return reply.send({ success: true, data: { id: newUser.id, email: newUser.email, nama: newUser.nama } });
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({ success: false, error: 'Internal Server Error' });
    }
  });

  // Protect the following routes
  server.addHook('preHandler', async (request, reply) => {
    server.log.info(`[PRE-HANDLER] method: ${request.method}, url: ${request.url}, routeOptions.url: ${request.routeOptions.url}`);
    // Skip auth for login and register
    if (request.url.includes('/login') || request.url.includes('/register')) {
      return;
    }
    await verifyAuth(request, reply);
  });


  // ==========================================
  // UPLOAD FILE ENDPOINT
  // ==========================================
  server.post('/upload', async (request, reply) => {
    try {
      const data = await request.file();
      if (!data) {
        return reply.status(400).send({ success: false, error: 'No file uploaded' });
      }

      const buffer = await data.toBuffer();
      const ext = data.filename.split('.').pop();
      const filename = `${Date.now()}-${randomUUID()}.${ext}`;

      await s3Client.send(new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: filename,
        Body: buffer,
        ContentType: data.mimetype
      }));

      // In Cloudflare R2, if you don't have a public domain, you can't easily access it. 
      // We will save the S3 style URL or Public R2 dev URL.
      // E.g. https://<ACCOUNT_ID>.r2.cloudflarestorage.com/<BUCKET_NAME>/<FILENAME>
      const publicUrl = `${process.env.R2_ENDPOINT}/${process.env.R2_BUCKET_NAME}/${filename}`;

      return reply.send({ success: true, url: publicUrl });
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({ success: false, error: 'Failed to upload to R2' });
    }
  });

  // ==========================================
  // MASTER DATA SYNC ENDPOINT
  // ==========================================
  server.get('/sync/master', async (request, reply) => {
    try {
      const companyData = await db.select().from(companies);
      
      // Select estates without boundary polygon (it's too heavy for mobile sync, maybe we only send afdeling/blok boundaries if needed, or we send them simplified)
      // For now, let's select everything except boundaryPolygon for estate, but wait, drizzle selects all by default.
      // We can use partial select.
      const estateData = await db.select({
        id: estates.id,
        companyId: estates.companyId,
        name: estates.name,
        code: estates.code,
        latitude: estates.latitude,
        longitude: estates.longitude
      }).from(estates);

      const afdelingData = await db.select({
        id: afdelings.id,
        estateId: afdelings.estateId,
        name: afdelings.name,
        code: afdelings.code,
        tipe: afdelings.tipe,
        rayon: afdelings.rayon,
        luasHa: afdelings.luasHa,
        // boundaryPolygon as GeoJSON string:
        boundaryPolygon: sql<string>`ST_AsGeoJSON(${afdelings.boundaryPolygon})`
      }).from(afdelings);

      const blokData = await db.select({
        id: bloks.id,
        afdelingId: bloks.afdelingId,
        name: bloks.name,
        code: bloks.code,
        tahunTanam: bloks.tahunTanam,
        varietas: bloks.varietas,
        sph: bloks.sph,
        luasHa: bloks.luasHa,
        totalPokokGis: bloks.totalPokokGis,
        boundaryPolygon: sql<string>`ST_AsGeoJSON(${bloks.boundaryPolygon})`
      }).from(bloks);

      const barisData = await db.select().from(baris);
      const hamaData = await db.select().from(hamaPenyakit);

      return reply.send({
        success: true,
        data: {
          companies: companyData,
          estates: estateData,
          afdelings: afdelingData,
          bloks: blokData,
          baris: barisData,
          hamaPenyakit: hamaData
        }
      });
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({ success: false, error: 'Internal Server Error' });
    }
  });

  // ==========================================
  // SYNC INSPECTION DATA (OFFLINE-FIRST)
  // ==========================================
  server.post('/sync/inspeksi', async (request, reply) => {
    // Body should be an array of inspections with their details
    const payload: any = request.body;
    
    // Minimal validation
    if (!payload || !Array.isArray(payload.inspeksi)) {
      return reply.status(400).send({ success: false, error: 'Invalid payload format' });
    }

    try {
      // In a real production app, we would use a transaction
      // For MVP, we insert sequentially or batched
      
      const results = [];
      
      for (const item of payload.inspeksi) {
        // Assume item contains: pokokId, userId, tanggalInspeksi, latitude, longitude, catatan, details (array)
        
        const [newInspeksi] = await db.insert(inspeksi).values({
          pokokId: item.pokokId,
          userId: item.userId,
          tanggalInspeksi: new Date(item.tanggalInspeksi),
          latitude: item.latitude,
          longitude: item.longitude,
          catatan: item.catatan,
          syncStatus: 'synced',
          syncedAt: new Date()
        }).returning();

        const detailsResult = [];
        if (item.details && Array.isArray(item.details)) {
          for (const det of item.details) {
            const [newDetail] = await db.insert(inspeksiDetail).values({
              inspeksiId: newInspeksi.id,
              hamaPenyakitId: det.hamaPenyakitId,
              tingkatSerangan: det.tingkatSerangan,
              persentaseSerangan: det.persentaseSerangan,
              bagianTerserang: det.bagianTerserang,
              catatan: det.catatan
            }).returning();
            
            // Handle photos if any
            if (det.photos && Array.isArray(det.photos)) {
              for (const photo of det.photos) {
                await db.insert(fotoBukti).values({
                  inspeksiDetailId: newDetail.id,
                  remoteUrl: photo.remoteUrl,
                  capturedAt: photo.capturedAt ? new Date(photo.capturedAt) : null
                });
              }
            }
            
            detailsResult.push(newDetail);
          }
        }
        
        results.push({
          localId: item.localId, // Used by Android to map back and update sync status
          remoteId: newInspeksi.id,
          status: 'success'
        });
      }

      return reply.send({ success: true, results });
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({ success: false, error: 'Failed to sync inspeksi' });
    }
  });

  // ==========================================
  // QUICK SCAN POKOK REGISTRATION
  // ==========================================
  server.post('/pokok', async (request, reply) => {
    const payload: any = request.body;
    
    // Payload should be array of pokok (barisId, nomorPokok, latitude, longitude, gpsRecordedBy)
    if (!payload || !Array.isArray(payload.pokokList)) {
      return reply.status(400).send({ success: false, error: 'Invalid payload format' });
    }

    try {
      const results = [];
      for (const p of payload.pokokList) {
        const [newPokok] = await db.insert(pokok).values({
          barisId: p.barisId,
          nomorPokok: p.nomorPokok,
          latitude: p.latitude,
          longitude: p.longitude,
          status: p.status || 'sehat',
          gpsRecordedAt: p.gpsRecordedAt ? new Date(p.gpsRecordedAt) : new Date(),
          gpsRecordedBy: p.gpsRecordedBy
        }).returning();
        
        results.push({
          localId: p.localId,
          remoteId: newPokok.id,
          status: 'success'
        });
      }
      
      return reply.send({ success: true, results });
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({ success: false, error: 'Failed to register pokok' });
    }
  });
}
