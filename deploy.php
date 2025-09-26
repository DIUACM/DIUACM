<?php
namespace Deployer;

require 'recipe/laravel.php';

// Config

set('repository', 'https://github.com/DIUACM/DIUACM.git');
set('writable_mode', 'chmod');

add('shared_files', []);
add('shared_dirs', []);
add('writable_dirs', []);

// Hosts

host('deploy.diuacm.com')
    ->set('remote_user', 'diuacmc1')
    ->set('deploy_path', '/home/diuacmc1/deploy.diuacm.com')
    ->set('http_user', 'diuacmc1');

// Tasks

// Build assets locally
task('build:assets', function () {
    writeln('Building assets locally...');
    runLocally('npm ci');
    runLocally('npm run build');
})->desc('Build assets locally');

// Upload built assets
task('upload:assets', function () {
    writeln('Uploading built assets...');
    $user = get('remote_user');
    $hostname = currentHost()->getHostname();
    $releasePath = get('release_path');
    
    runLocally("scp -r public/build {$user}@{$hostname}:{$releasePath}/public/");
})->desc('Upload built assets to server');

// Skip npm tasks on server by overriding them
task('deploy:npm', function () {
    writeln('Skipping npm install on server (assets built locally)');
});

// Hooks

// Build assets locally before deployment starts
before('deploy', 'build:assets');

// Upload assets after the release is prepared but before going live
after('deploy:vendors', 'upload:assets');

after('deploy:failed', 'deploy:unlock');
