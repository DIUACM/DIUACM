<?php

use App\Enums\VisibilityStatus;
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
        Schema::create('internal_contests', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->string('semester');
            $table->text('description')->nullable();
            $table->dateTime('registration_deadline');
            $table->dateTime('registration_start_time');
            $table->unsignedInteger('registration_limit')->nullable();
            $table->decimal('registration_fee', 8, 2)->default(0);
            $table->string('student_id_rules')->nullable();
            $table->string('student_id_rules_guide')->nullable();
            $table->json('pickup_points')->nullable();
            $table->json('departments')->nullable();
            $table->json('sections')->nullable();
            $table->json('lab_teacher_names')->nullable();
            $table->json('tshirt_sizes')->nullable();
            $table->string('status')->default(VisibilityStatus::DRAFT);

            // Payment Configuration
            $table->boolean('sslcommerz_enabled')->default(false);
            $table->boolean('bkash_enabled')->default(false);
            $table->string('bkash_receiver_number')->nullable();
            $table->text('bkash_instruction')->nullable();
            $table->boolean('rocket_enabled')->default(false);
            $table->string('rocket_receiver_number')->nullable();
            $table->text('rocket_instruction')->nullable();
            $table->boolean('nagad_enabled')->default(false);
            $table->string('nagad_receiver_number')->nullable();
            $table->text('nagad_instruction')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('internal_contests');
    }
};
