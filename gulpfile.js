'use strict';

const gulp = require('gulp'); //подкулючем сам Gulp подключем плагины gulp
const sass = require('gulp-sass'); //для компиляции нашего SCSS кода
const del = require('del'); // говорит сам за себя
const combiner = require('stream-combiner2').obj; // позволяет обрабатывать ошибки объединяя несколько потоков в один
const autoprefixer = require('gulp-autoprefixer'); // автоматически добавляет вендорные префиксы к CSS свойствам
const notify = require('gulp-notify'); // выводит сообщения об ошибках
const browserSync = require('browser-sync').create(); //перезагружает страницу браузера при изменениях
const rigger = require('gulp-rigger');  //Плагин позволяет импортировать один файл в другой простой конструкцией //=sidebar.html
const uglify = require('gulp-uglify');  //сжимает js
const imagemin = require('gulp-imagemin'); //сжимает картинки
const pngquant = require('imagemin-pngquant'); // дополнение для png формата
const sourcemaps = require('gulp-sourcemaps'); //создание карты для отладки
const cssmin = require('gulp-minify-css'); // сжатие стилей
const rename = require("gulp-rename");
const gulpIf =  require('gulp-if');

const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV == 'development';

const path = {  //прописываем пути
              build: {
                  html: 'public/',
                  js: 'public/js/',
                  css: 'public/css/',
                  img: 'public/img/',
                  fonts: 'public/fonts/'
              },
              src: {
                  html: 'src/*.html',
                  js: 'src/js/main.js',
                  style: 'src/styles/**/*.scss',
                  img: 'src/img/**/*.*',
                  fonts: 'src/fonts/**/*.*'
              },
              watch: {
                  html: 'src/**/*.html',
                  js: 'src/js/**/*.js',
                  style: 'src/styles/**/*.scss',
                  img: 'src/img/**/*.*',
                  fonts: 'src/fonts/**/*.*',
                  bsWatch: './public/**/*.*'
              },
              publicDir: './public'
            };

const config = {
    server: {
        baseDir: "./public"
    },
    host: 'localhost',
    port: 3000
};

gulp.task('html', function () {
    return gulp.src(path.src.html, {since: gulp.lastRun('html')}) //считывает файлы. Не файлы которые не менялись с последнего запуска 
        .pipe(rigger())  //делает вставку из других файлов
        .pipe(gulp.dest(path.build.html)) //складывает обработаные файлы по указаному пути
});

gulp.task('styles', function() {
    return combiner(
        gulp.src(path.src.style),
        sass(),
        autoprefixer({  //добавляем вендорные префиксы
            cascade: true
        }),
        gulpIf(isDevelopment, sourcemaps.init()),  //создаем карту
        cssmin(),				   //сжимаем стили
        rename({				   //добавляем суфикс min
            suffix: '.min'
        }),
        gulpIf(isDevelopment, sourcemaps.write()), //записываем карту
        gulp.dest(path.build.css)
    ).on('error', notify.onError());               //если есть ошибки выводим сообщение
}); 

gulp.task('clean', function() {
  return del(path.publicDir);
});

gulp.task('scripts', function () {
    return gulp.src(path.src.js) 
        .pipe(rigger()) 
        .pipe(gulpIf(isDevelopment, sourcemaps.init())) 
        .pipe(uglify()) //сжимаем скрипты
        .pipe(gulpIf(isDevelopment, sourcemaps.write())) 
        .pipe(gulp.dest(path.build.js));
});

gulp.task('image', function () {
   return gulp.src(path.src.img, {since: gulp.lastRun('image')}) 
        .pipe(imagemin({
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            use: [pngquant()],
            interlaced: true
        }))
        .pipe(gulp.dest(path.build.img));
});

gulp.task('fonts', function() {
    return gulp.src(path.src.fonts, {since: gulp.lastRun('fonts')})
        .pipe(gulp.dest(path.build.fonts))
});

gulp.task('build', gulp.series(  //запускаем поочередно очистку и одновременно компиляцию
    'clean',
    gulp.parallel('html', 'styles', 'image', 'fonts', 'scripts'))
);

gulp.task('watch', function() {
  gulp.watch(path.watch.html, gulp.series('html'));
  gulp.watch(path.watch.style, gulp.series('styles'));
  gulp.watch(path.watch.img, gulp.series('image'));
  gulp.watch(path.watch.fonts, gulp.series('fonts'));
  gulp.watch(path.watch.js, gulp.series('scripts'));
});

gulp.task('bs', function() {
  browserSync.init(config);

  browserSync.watch(path.watch.bsWatch).on('change', browserSync.reload);
});

gulp.task('default',
    gulp.series('build', gulp.parallel('watch', 'bs'))
);