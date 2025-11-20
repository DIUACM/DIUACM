<?php

use App\Enums\RegistrationStatus;
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
        Schema::create('internal_contest_registrations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('internal_contest_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            // Personal Information
            $table->string('name');
            $table->string('email');
            $table->string('student_id');
            $table->string('phone');
            $table->string('section');
            $table->string('department');
            $table->string('lab_teacher_name');

            // Event Details
            $table->string('tshirt_size');
            $table->string('gender');
            $table->boolean('transport_service_required')->default(false);
            $table->string('pickup_point')->nullable();

            // Registration Status
            $table->string('status')->default(RegistrationStatus::PENDING->value);

            $table->timestamps();

            // Ensure one registration per user per contest
            $table->unique(['internal_contest_id', 'user_id'], 'contest_user_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('internal_contest_registrations');
    }
};
