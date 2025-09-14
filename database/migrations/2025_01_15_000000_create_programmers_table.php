<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('programmers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('cascade');
            $table->string('name');
            $table->string('email')->unique();
            $table->string('username')->unique();
            $table->string('image')->nullable();
            $table->enum('gender', ['male', 'female', 'other'])->nullable();
            $table->string('phone')->nullable();
            $table->string('codeforces_handle')->nullable();
            $table->string('atcoder_handle')->nullable();
            $table->string('vjudge_handle')->nullable();
            $table->string('department')->nullable();
            $table->string('student_id')->nullable();
            $table->integer('max_cf_rating')->nullable();
            $table->text('bio')->nullable();
            $table->json('skills')->nullable();
            $table->integer('experience_years')->nullable();
            $table->string('github_handle')->nullable();
            $table->string('linkedin_handle')->nullable();
            $table->string('website')->nullable();
            $table->string('location')->nullable();
            $table->boolean('is_available_for_hire')->default(false);
            $table->decimal('hourly_rate', 10, 2)->nullable();
            $table->json('preferred_languages')->nullable();
            $table->timestamps();

            $table->index(['codeforces_handle']);
            $table->index(['atcoder_handle']);
            $table->index(['is_available_for_hire']);
            $table->index(['location']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('programmers');
    }
};