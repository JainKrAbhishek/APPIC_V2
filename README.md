
# GRE Prep Application

## English Documentation

### Overview
This application is a comprehensive GRE preparation tool designed to help users improve their verbal, vocabulary, and quantitative skills through various practice modes. The platform offers vocabulary learning, practice sets, and performance tracking to enhance the user's GRE preparation experience.

### Features

#### User Management
- User registration and authentication
- User profiles with progress tracking
- Role-based access control (free, premium, business, admin)
- Subscription management

#### Vocabulary Practice
- Extensive vocabulary database organized by days
- Multiple practice modes:
  - Synonym matching
  - Definition matching
  - Fill in the blanks
  - Spelling practice
- Bookmarking system for difficult words
- Progress tracking for vocabulary learning

#### Verbal Practice
- Reading comprehension exercises
- Text completion questions
- Sentence equivalence practice
- Verbal reasoning test simulations

#### Quantitative Practice
- Problem-solving exercises
- Data interpretation questions
- Timed practice tests
- Built-in GRE calculator

#### Practice Features
- Question bookmarking
- Question navigator
- Pomodoro timer for study sessions
- Detailed performance analytics
- Review of answered questions

### Technical Stack
- Frontend: React with TypeScript, Shadcn UI components
- Backend: Express.js with TypeScript
- Database: PostgreSQL with Drizzle ORM
- Authentication: Passport.js with secure session handling

### Getting Started

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up environment variables in .env file
4. Run the development server:
   ```
   npm run dev
   ```

### Project Structure
- `/client`: Frontend React application
- `/server`: Backend Express API
- `/shared`: Shared TypeScript types and schemas
- `/public`: Static assets

### Usage Guide

#### Vocabulary Practice
1. Navigate to the Practice tab
2. Select the Vocabulary section
3. Choose a day and practice mode
4. Complete the exercises to track your progress

#### Practice Sets
1. Navigate to the Practice tab
2. Select Verbal or Quantitative section
3. Choose a practice set
4. Answer questions and receive feedback
5. Review your results after completion

#### User Dashboard
Track your progress, access recent activities, and view statistics about your performance across different practice types.

## Turkish Documentation

### Genel Bakış
Bu uygulama, kullanıcıların sözel, kelime bilgisi ve nicel becerilerini çeşitli pratik modları aracılığıyla geliştirmelerine yardımcı olmak için tasarlanmış kapsamlı bir GRE hazırlık aracıdır. Platform, kullanıcının GRE hazırlık deneyimini geliştirmek için kelime öğrenme, alıştırma setleri ve performans takibi sunmaktadır.

### Özellikler

#### Kullanıcı Yönetimi
- Kullanıcı kaydı ve kimlik doğrulama
- İlerleme takibi ile kullanıcı profilleri
- Rol tabanlı erişim kontrolü (ücretsiz, premium, iş, yönetici)
- Abonelik yönetimi

#### Kelime Pratiği
- Günlere göre düzenlenmiş kapsamlı kelime veritabanı
- Çoklu pratik modları:
  - Eş anlamlı kelime eşleştirme
  - Tanım eşleştirme
  - Boşlukları doldurma
  - Yazım pratiği
- Zor kelimeler için yer imi sistemi
- Kelime öğrenimi için ilerleme takibi

#### Sözel Pratik
- Okuduğunu anlama alıştırmaları
- Metin tamamlama soruları
- Cümle eşdeğerliği pratiği
- Sözel akıl yürütme testi simülasyonları

#### Nicel Pratik
- Problem çözme alıştırmaları
- Veri yorumlama soruları
- Zamanlı pratik testleri
- Dahili GRE hesap makinesi

#### Pratik Özellikleri
- Soru yer işaretleme
- Soru gezgini
- Çalışma seansları için Pomodoro zamanlayıcısı
- Detaylı performans analitiği
- Cevaplanan soruların incelenmesi

### Teknik Altyapı
- Frontend: React ve TypeScript, Shadcn UI bileşenleri
- Backend: TypeScript ile Express.js
- Veritabanı: Drizzle ORM ile PostgreSQL
- Kimlik Doğrulama: Güvenli oturum yönetimi ile Passport.js

### Başlangıç Kılavuzu

1. Depoyu klonlayın
2. Bağımlılıkları yükleyin:
   ```
   npm install
   ```
3. .env dosyasında ortam değişkenlerini ayarlayın
4. Geliştirme sunucusunu çalıştırın:
   ```
   npm run dev
   ```

### Proje Yapısı
- `/client`: Frontend React uygulaması
- `/server`: Backend Express API
- `/shared`: Paylaşılan TypeScript türleri ve şemaları
- `/public`: Statik varlıklar

### Kullanım Kılavuzu

#### Kelime Pratiği
1. Pratik sekmesine gidin
2. Kelime bölümünü seçin
3. Bir gün ve pratik modu seçin
4. İlerlemenizi takip etmek için alıştırmaları tamamlayın

#### Alıştırma Setleri
1. Pratik sekmesine gidin
2. Sözel veya Nicel bölüm seçin
3. Bir alıştırma seti seçin
4. Soruları cevaplayın ve geri bildirim alın
5. Tamamlandıktan sonra sonuçlarınızı inceleyin

#### Kullanıcı Panosu
İlerlemenizi takip edin, son aktivitelere erişin ve farklı pratik türlerindeki performansınız hakkında istatistikleri görüntüleyin.

## Admin Features / Yönetici Özellikleri

### English
- User management: Add, edit, and delete users
- Content management: Add and manage vocabulary, questions, and practice sets
- Access control: Manage user roles and subscription status
- Analytics: View overall platform usage statistics

### Turkish
- Kullanıcı yönetimi: Kullanıcı ekleme, düzenleme ve silme
- İçerik yönetimi: Kelime, soru ve alıştırma setleri ekleme ve yönetme
- Erişim kontrolü: Kullanıcı rollerini ve abonelik durumunu yönetme
- Analitik: Genel platform kullanım istatistiklerini görüntüleme

## Project Setup / Proje Kurulumu

### Environment Variables / Ortam Değişkenleri

```
DATABASE_URL=postgresql://username:password@localhost:5432/gre_prep
SESSION_SECRET=your_session_secret
PORT=5000
NODE_ENV=development
```

### Database Setup / Veritabanı Kurulumu

Run migrations / Migrasyonları çalıştırın:
```
npm run db:migrate
```

Seed initial data / İlk verileri yükleyin:
```
npm run db:seed
```

## License / Lisans
© 2023 GRE Prep Application. All rights reserved. / Tüm hakları saklıdır.
